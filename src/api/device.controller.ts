import { Body, Controller, Get, Inject, Param, Post } from '@nestjs/common';
import { ApiBody, ApiTags } from '@nestjs/swagger';
import { WhatsappService } from 'src/whatsapp.service';
import { Whatsapp } from 'venom-bot';
import { RequestScan } from './all.dto';

@Controller('api')
@ApiTags('device')
export class DeviceController {
  constructor(
    // @Inject('WHATSAPP') private whatsapp: Whatsapp,
    private whatsappService: WhatsappService
  ) {}

  @Get('/health')
  getHealth() {
    return true;
  }

  @Post('/killServiceWorker')
  killServiceWorker() {
    // return this.whatsapp.killServiceWorker();
  }

  @Post('/restartService')
  restartService() {
    // return this.whatsapp.restartService();
  }

  @Get('/getHostDevice')
  getHostDevice() {
    // return this.whatsapp.getHostDevice();
  }

  @Post('/requestScan')
  requestScan(@Body() message: RequestScan) {
    return this.whatsappService.initClient(message.name)
    // return this.whatsapp.getConnectionState();
  }

  @Get('/getConnectionState')
  getConnectionState() {
    // return this.whatsappService.initClient('test')
    // return this.whatsapp.getConnectionState();
  }

  @Get('/getBatteryLevel')
  getBatteryLevel() {
    // return this.whatsapp.getBatteryLevel();
  }

  @Get('/isConnected')
  isConnected() {
    // return this.whatsapp.isConnected();
  }

  @Get('/getWAVersion')
  getWAVersion() {
    // return this.whatsapp.getWAVersion();
  }

  @Get('/logout')
  logout() {
    // return this.whatsapp.logout();
  }
}
