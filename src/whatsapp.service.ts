import { create, Message, Whatsapp } from 'venom-bot';
import {
  Inject,
  Injectable,
  Logger,
  OnApplicationShutdown,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as path from 'path';
import { WhatsappConfigService } from './config.service';
import request = require('requestretry');
import mime = require('mime-types');
import fs = require('fs');
import del = require('del');
import { DateTime } from 'luxon';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { promisify } = require('util');
const writeFileAsync = promisify(fs.writeFile);

const SECOND = 1000;

export const whatsappProvider = {
  provide: 'WHATSAPP',
  useFactory: async (config: ConfigService) =>
    create(
      'message',
      (base64Qr, asciiQR) => {
        //save qr to file
        const base64Data = base64Qr.replace(/^data:image\/png;base64,/, '');

        fs.writeFile(
          '/var/www/html/aipos_bplus_mutasi/assets/last_request_whatsapp.txt',
          DateTime.now().toISO(),
          function(err) {
            if (err) {
              console.log(err);
            }
          },
        );
        fs.writeFile(
          '/var/www/html/aipos_bplus_mutasi/assets/qr.png',
          base64Data,
          'base64',
          function(err) {
            // console.log("GAGAL LEK, reason" + err);
          },
        );
      },
      statusFind => {
        console.log(statusFind);
      },
      {
        headless: true,
        devtools: false,
        useChrome: false,
        debug: false,
        logQR: false,
        browserArgs: [
          '--user-agent=Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/84.0.4147.105 Safari/537.36',
          '--log-level=3',
          '--no-default-browser-check',
          '--disable-site-isolation-trials',
          '--no-experiments',
          '--ignore-gpu-blacklist',
          '--ignore-certificate-errors',
          '--ignore-certificate-errors-spki-list',
          '--disable-gpu',
          '--disable-extensions',
          '--disable-default-apps',
          '--enable-features=NetworkService',
          '--disable-setuid-sandbox',
          '--no-sandbox',
          // Extras
          '--disable-webgl',
          '--disable-threaded-animation',
          '--disable-threaded-scrolling',
          '--disable-in-process-stack-traces',
          '--disable-histogram-customizer',
          '--disable-gl-extensions',
          '--disable-composited-antialiasing',
          '--disable-canvas-aa',
          '--disable-3d-apis',
          '--disable-accelerated-2d-canvas',
          '--disable-accelerated-jpeg-decoding',
          '--disable-accelerated-mjpeg-decode',
          '--disable-app-list-dismiss-on-blur',
          '--disable-accelerated-video-decode',
          '--single-process', // <- this one doesn't works in Windows
        ],
        autoClose: 0,
        createPathFileToken: true,
        multidevice: false,
        puppeteerOptions: {},
        folderNameToken: 'tokens',
      },
    ),
};

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

  constructor(
    @Inject('WHATSAPP') private whatsapp: Whatsapp,
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
        this.whatsapp[hook](data => this.onMessageHook(data, url));
      } else {
        this.whatsapp[hook](data => this.callWebhook(data, url));
      }
      this.log.log(`Hook '${hook}' was enabled to url: ${url}`);
    }
    this.log.log('Webhooks were configured.');
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

  private async onMessageHook(message: Message, url: string) {
    if (message.isMMS || message.isMedia) {
      this.downloadAndDecryptMedia(message).then(data =>
        this.callWebhook(data, url),
      );
    } else {
      this.callWebhook(message, url);
    }
  }

  private async downloadAndDecryptMedia(message: Message) {
    return this.whatsapp.decryptFile(message).then(async buffer => {
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
    return this.whatsapp.close();
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
