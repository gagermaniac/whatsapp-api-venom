import { Body, Controller, NotImplementedException, Param, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import {
    Chat,
    MessageContactVcard,
    MessageFile,
    MessageImage,
    MessageLinkPreview,
    MessageLocation,
    MessageReply,
    MessageText
} from "./all.dto";
import { WhatsappService } from 'src/whatsapp.service';

@Controller('api')
@ApiTags('chatting')
export class ChattingController {

    constructor(
        private whatsappService: WhatsappService
    ) {}

    @Post('/sendContactVcard/:name')
    sendContactVcard(@Param('name') name: string, @Body() message: MessageContactVcard) {
        return this.whatsappService.getClient(name).sendContactVcard(message.number + '@c.us', message.contactsId, message.name)
    }

    @Post('/send-message/:name')
    @ApiOperation({ summary: 'Send a message message' })
    sendText(@Param('name') name: string, @Body() message: MessageText) {
        return this.whatsappService.getClient(name).sendText(message.number + '@c.us', message.message)
    }

    @Post('/send-location/:name')
    sendLocation(@Param('name') name: string, @Body() message: MessageLocation) {
        return this.whatsappService.getClient(name).sendLocation(message.number + '@c.us', message.latitude, message.longitude, message.title)
    }

    @Post('/send-linkPreview/:name')
    sendLinkPreview(@Param('name') name: string, @Body() message: MessageLinkPreview) {
        return this.whatsappService.getClient(name).sendLinkPreview(message.number + '@c.us', message.url, message.title)
    }

    @Post('/send-image/:name')
    @ApiOperation({ summary: 'NOT IMPLEMENTED YET' })
    sendImage(@Param('name') name: string, @Body() message: MessageImage) {
        // throw new NotImplementedException();
        // TODO: Accept image URL, download it and then send with path
        return this.whatsappService.getClient(name).sendImage(message.number + '@c.us', message.path, message.filename, message.caption)
    }

    @Post('/send-file/:name')
    @ApiOperation({ summary: 'NOT IMPLEMENTED YET' })
    sendFile(@Param('name') name: string, @Body() message: MessageFile) {
        // throw new NotImplementedException();
        // TODO: Accept File URL, download it and then send with path
        return this.whatsappService.getClient(name).sendFile(message.number + '@c.us', message.path, message.filename, message.caption)
    }

    @Post('/reply/:name')
    @ApiOperation({ summary: 'Reply to a message message' })
    reply(@Param('name') name: string, @Body() message: MessageReply) {
        return this.whatsappService.getClient(name).reply(message.number + '@c.us', message.message, message.reply_to)
    }

    @Post('/send-seen/:name')
    sendSeen(@Param('name') name: string, @Body() chat: Chat) {
        return this.whatsappService.getClient(name).sendSeen(chat.number)
    }

    @Post('/start-typing/:name')
    startTyping(@Param('name') name: string, @Body() chat: Chat) {
        // It's infinitive action
        // this.whatsapp.startTyping(chat.number)
        return true
    }

    @Post('/stop-typing/:name')
    stopTyping(@Param('name') name: string, @Body() chat: Chat) {
        // this.whatsapp.stopTyping(chat.number)
        return true
    }
}
