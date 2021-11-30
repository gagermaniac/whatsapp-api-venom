import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { WhatsappConfigService } from "./config.service";
import * as fileUpload from 'express-fileupload';
async function bootstrap() {
    const app = await NestFactory.create(AppModule, {
        logger: process.env.DEBUG != undefined ? ['log', 'debug', 'error', 'verbose', 'warn'] :
            ['log', 'error', 'warn'],
    });
    app.use(fileUpload({
    }))
    app.enableCors();
    app.enableShutdownHooks();
    const options = new DocumentBuilder()
        .setTitle('WhatsApp venom API')
        .setDescription('WhatsApp HTTP API that you can configure in a click!')
        .setExternalDoc("Github WhatsApp API venom", "https://github.com/diazzaid/whatsapp-venom-api")
        .setVersion('1.0')
        .addTag('device', 'Device information')
        .addTag('chatting', 'Chat methods')
        .addApiKey({
            type: 'apiKey',
            description: 'Your secret key',
            name: 'X-VENOM-TOKEN'
        }
        )
        .build();
    const document = SwaggerModule.createDocument(app, options);
    SwaggerModule.setup('', app, document);

    const config = app.get(WhatsappConfigService);
    await app.listen(config.port);
    console.log(`WhatsApp HTTP API is running on: ${await app.getUrl()}`);
}

bootstrap();
