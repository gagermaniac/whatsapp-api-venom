import { create, Message, Whatsapp } from 'venom-bot';
import {
  Inject,
  Injectable,
  Logger,
  OnApplicationShutdown,
} from '@nestjs/common';
import * as path from 'path';
import { WhatsappConfigService } from './config.service';
import request = require('requestretry');
import mime = require('mime-types');
import fs = require('fs');
import del = require('del');
import { DEFAULT_URL, headlessClient } from './constants';
import { threadId } from 'worker_threads';
import { json } from 'express';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { promisify } = require('util');
const writeFileAsync = promisify(fs.writeFile);

const SECOND = 1000;

const ONMESSAGE_HOOK = 'onMessage';
const HOOKS = [
  ONMESSAGE_HOOK,
  'onStateChange',
  'onAck',
  // TODO: IMPLEMENTED THESE TOO
  // "onLiveLocation",
  // "onParticipantsChanged",
  'onAddedToGroup',
];
const ENV_PREFIX = 'WHATSAPP_HOOK_';

@Injectable()
export class WhatsappService implements OnApplicationShutdown {
  private RETRY_DELAY = 15;
  private RETRY_ATTEMPTS = 10000;
  readonly FILES_FOLDER: string;
  readonly mimetypes: string[] | null;
  readonly files_lifetime: number;
  public clientList: {} = {}

  constructor(
    private config: WhatsappConfigService,
    private log: Logger,
  ) {
    this.log.setContext('WhatsappService');

    this.FILES_FOLDER = this.config.files_folder;
    this.clean_downloads();
    this.mimetypes = this.config.mimetypes;
    this.files_lifetime = this.config.files_lifetime * SECOND;

    this.log.log('Configuring webhooks...');
    for (const hook of HOOKS) {
      const env_name = ENV_PREFIX + hook.toUpperCase();
      const url = config.get(env_name);
      if (!url) {
        this.log.log(
          `Hook '${hook}' is disabled. Set ${env_name} environment variable to url if you want to enabled it.`,
        );
        continue;
      }

      if (hook === ONMESSAGE_HOOK) {
        for (var item in this.clientList) {
          this.clientList[item][hook](data => this.onMessageHook(this.clientList[item], data, url))
        }
      } else {
        for (var item in this.clientList) {
          this.clientList[item][hook](data => this.callWebhook(data, url))
        }
      }
      this.log.log(`Hook '${hook}' was enabled to url: ${url}`);
    }
    this.log.log('Webhooks were configured.');
  }

  private deleteFile(src: string) {
    if (fs.existsSync(src)) {
      fs.unlink(src, (err) => {
        if (err) {
          console.log(err)
        }
        console.log('deleted')
      })
    }
  }

  public async initClient(name: string) {
    let client = {}
    let file_name = `${DEFAULT_URL}assets/qr/qr-${name}.png`

    // delete qr file
    this.deleteFile(file_name)

    if (typeof(this.clientList[name]) !== "undefined") {
      console.log("CONNECTED")
      return "CONNECTED"
    } else {
      return await create(
        name,
        (base64Qr, asciiQR) => {
          const base64Data = base64Qr.replace(/^data:image\/png;base64,/, '');
          fs.writeFile(
            file_name,
            base64Data,
            'base64',
            function (err) {
            },
          )
          // fs.writeFile('webclient.json', { name: name }, { flag: "a+" }, (err) => {
          //   if (err) throw err;
          //     con        sole.log('The file is created if not existing!!');
          // }); 
        },
        statusFind => {
          console.log(statusFind);
        },
        headlessClient
      )
      .then((cli) => {
        client = cli
        this.clientList[name] = client
        return "CONNECTED"
      })
      .catch((erro) => {
        console.log(erro);
        return "ERROR"
      });
    }
  }

  public getClient(name: string): Whatsapp {
    let client = null
    if (typeof(this.clientList[name]) !== "undefined") {
      client = this.clientList[name]
    }
    return client
  }

  public async getAllClient() {
    let result = []
    for (var item in this.clientList) {
      const host = await this.getClient(item)?.getHostDevice()
      result.push({
        name: item,
        id: typeof(host.id) !== "undefined" ? host.id : null
      })
    }
    return result
  }

  public async getAllClientConnection() {
    let result = []
    for (var item in this.clientList) {
      const conn = await this.getClient(item)?.getConnectionState()
      result.push({
        name: item,
        status: conn
      })
    }
    return result
  }

  private clean_downloads() {
    if (fs.existsSync(this.FILES_FOLDER)) {
      del([`${this.FILES_FOLDER}/*`], { force: true }).then(paths =>
        console.log('Deleted files and directories:\n', paths.join('\n')),
      );
    } else {
      fs.mkdirSync(this.FILES_FOLDER);
      this.log.log(`Directory '${this.FILES_FOLDER}' created from scratch`);
    }
  }

  private callWebhook(data, url) {
    this.log.log(`Sending POST to ${url}...`);
    this.log.debug(`POST DATA: ${JSON.stringify(data)}`);

    // TODO: Use HttpModule with retry
    request.post(
      url,
      {
        json: data,
        maxAttempts: this.RETRY_ATTEMPTS,
        retryDelay: this.RETRY_DELAY * SECOND,
        retryStrategy: request.RetryStrategies.HTTPOrNetworkError,
      },
      (error, res, body) => {
        if (error) {
          this.log.error(error);
          return;
        }
        this.log.log(
          `POST request was sent with status code: ${res.statusCode}`,
        );
        this.log.verbose(`Response: ${JSON.stringify(body)}`);
      },
    );
  }

  private async onMessageHook(whatsapp:Whatsapp, message: Message, url: string) {
    if (message.isMMS || message.isMedia) {
      this.downloadAndDecryptMedia(whatsapp, message).then(data =>
        this.callWebhook(data, url),
      );
    } else {
      this.callWebhook(message, url);
    }
  }

  private async downloadAndDecryptMedia(whats :Whatsapp, message: Message) {
    return whats.decryptFile(message).then(async buffer => {
      // Download only certain mimetypes
      if (
        this.mimetypes !== null &&
        !this.mimetypes.some(type => message.mimetype.startsWith(type))
      ) {
        this.log.log(
          `The message ${message.id} has ${message.mimetype} media, skip it.`,
        );
        message.clientUrl = '';
        return message;
      }

      this.log.log(`The message ${message.id} has media, downloading it...`);
      const fileName = `${message.id}.${mime.extension(message.mimetype)}`;
      const filePath = path.resolve(`${this.FILES_FOLDER}/${fileName}`);
      this.log.verbose(`Writing file to ${filePath}...`);
      await writeFileAsync(filePath, buffer);
      this.log.log(`The file from ${message.id} has been saved to ${filePath}`);

      message.clientUrl = this.config.files_url + fileName;
      this.removeFile(filePath);
      return message;
    });
  }

  onApplicationShutdown(signal?: string): any {
    this.log.log('Close a browser...');
    // return this.whatsapp.close();
  }

  private removeFile(file: string) {
    setTimeout(
      () =>
        fs.unlink(file, () => {
          this.log.log(`File ${file} was removed`);
        }),
      this.files_lifetime,
    );
  }
}
