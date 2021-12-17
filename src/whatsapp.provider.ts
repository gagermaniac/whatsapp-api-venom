import { ConfigService } from "@nestjs/config";
import { create } from "venom-bot";
import fs = require('fs');
import { headlessClient } from "./constants";

export const whatsappProvider = {
    provide: 'WHATSAPP',
    useFactory: async (config: ConfigService) =>
      create(
        'message',
        (base64Qr, asciiQR) => {
          //save qr to file
          const base64Data = base64Qr.replace(/^data:image\/png;base64,/, '');
          fs.writeFile(
            '/var/www/html/aipos_bplus_mutasi/assets/qr.png',
            base64Data,
            'base64',
            function (err) {
              // console.log("GAGAL LEK, reason" + err);
            },
          );
        },
        statusFind => {
          console.log(statusFind);
        },
        headlessClient
      ),
  };