import {Controller, Get, Inject, Param, Res} from '@nestjs/common';
import {ApiTags} from "@nestjs/swagger";
import {Whatsapp} from "venom-bot";
import {Readable} from "stream";
import {Response} from 'express';
import { WhatsappService } from 'src/whatsapp.service';


@Controller('api')
@ApiTags('screenshot')
export class ScreenshotController {

    constructor(
        private whatsappService: WhatsappService
    ) {}

    @Get('/screenshot/:name') 
    async screenshot(@Param('name') name: string, @Res() res: Response) {
        const buffer = await this.whatsappService.getClient(name).page.screenshot();
        const stream = new Readable();
        stream.push(buffer);
        stream.push(null);

        res.set({
            'Content-Type': 'image/png',
            'Content-Length': buffer.length,
        });
        stream.pipe(res)
    }
}

