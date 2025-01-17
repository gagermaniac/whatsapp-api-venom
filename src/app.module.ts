import {Logger, Module} from '@nestjs/common';
import {ChattingController} from './api/chatting.controller';
import {DeviceController} from "./api/device.controller";
import {WhatsappService} from "./whatsapp.service";
import {ScreenshotController} from "./api/screenshot.controller";
import {ConfigModule, ConfigService} from "@nestjs/config";
import {WhatsappConfigService} from "./config.service";
import {ServeStaticModule} from "@nestjs/serve-static";
import { whatsappProvider } from './whatsapp.provider';

@Module({
    imports: [
        WhatsappConfigService,
        ConfigModule.forRoot({
            isGlobal: true,
        }),
        // ServeStaticModule.forRootAsync({
        //     imports: [WhatsappConfigService],
        //     extraProviders: [WhatsappConfigService],
        //     inject: [WhatsappConfigService],
        //     useFactory: (config: WhatsappConfigService) => {
        //         return [{
        //             rootPath: config.files_folder,
        //             serveRoot: config.files_uri,
        //         }]
        //     },
        // }),
    ],
    controllers: [ChattingController, DeviceController, ScreenshotController],
    providers: [WhatsappService, Logger, WhatsappConfigService, ConfigService],
})
export class AppModule {
}
