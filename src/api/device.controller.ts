import { Body, Controller, Get, Inject, Param, Post } from '@nestjs/common';
import { ApiBody, ApiTags } from '@nestjs/swagger';
import { WhatsappService } from 'src/whatsapp.service';
import { Whatsapp } from 'venom-bot';
import { RequestScan } from './all.dto';

@Controller('api')
@ApiTags('device')
export class DeviceController {
  constructor(
    private whatsappService: WhatsappService
  ) {}

  @Get('/health')
  getHealth() {
    return true;
  }

  @Post('/killServiceWorker/:name')
  killServiceWorker(@Param('name') name: string) {
    return this.whatsappService.getClient(name).killServiceWorker()
  }

  @Post('/restartService/:name')
  restartService(@Param('name') name: string) {
    return this.whatsappService.getClient(name).restartService()
  }

  @Get('/getHostDevice/:name')
  getHostDevice(@Param('name') name: string) {
    return this.whatsappService.getClient(name).getHostDevice()
  }

  @Post('/requestScan')
  requestScan(@Body() message: RequestScan) {
    return this.whatsappService.initClient(message.name)
  }

  @Get('/getConnectionState/:name')
  getConnectionState(@Param('name') name: string) {
    const client = this.whatsappService.getClient(name)
    if (client !== null) {
      return client?.getConnectionState()
    } else {
      return "ERROR"
    }
  }

  @Get('/getAllConnection')
  getAllConnection() {
    return this.whatsappService.getAllClientConnection()
  }

  @Get('/getAllClient')
  getAllClient() {
    return this.whatsappService.getAllClient()
  }

  @Get('/getBatteryLevel/:name')
  getBatteryLevel(@Param('name') name: string) {
    return this.whatsappService.getClient(name).getBatteryLevel()
  }

  @Get('/isConnected/:name')
  isConnected(@Param('name') name: string) {
    return this.whatsappService.getClient(name).isConnected()
  }

  @Get('/getWAVersion/:name')
  getWAVersion(@Param('name') name: string) {
    return this.whatsappService.getClient(name).getWAVersion()
  }

  @Get('/logout/:name')
  logout(@Param('name') name: string) {
    const client = this.whatsappService.getClient(name).close()
    return "CLOSE"
  }
}
