import {ApiProperty} from "@nestjs/swagger";

const number = ApiProperty({
    example: '6281224993382'
})

export class Chat {
    @number
    number: string;
}

export class MessageContactVcard {
    @number
    number: string;
    contactsId: string;
    name: string
}

export class MessageText {
    @number
    number: string;
    message: string;
}

export class MessageReply {
    @number
    number: string;
    message: string;
    @ApiProperty({
        example: 'message.id',
    })
    reply_to: string;
}

export class MessageLocation {
    @number
    number: string;
    latitude: string;
    longitude: string;
    title: string;
}

export class MessageImage {
    @number
    number: string;
    path: string;
    filename: string;
    caption: string;
}

export class MessageFile {
    @number
    number: string;
    path: string;
    filename: string;
    caption: string;
}

export class MessageLinkPreview {
    @number
    number: string;
    url: string;
    title: string;
}

export class RequestScan {
    @ApiProperty({
        example: 'name of request',
    })
    name: string;
}
