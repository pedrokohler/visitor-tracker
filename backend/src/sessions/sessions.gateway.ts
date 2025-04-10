import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
} from '@nestjs/websockets';
import { SessionsService } from './sessions.service';
import { CreateSessionDto } from './dto/create-session.dto';
import { UpdateSessionDto } from './dto/update-session.dto';

@WebSocketGateway()
export class SessionsGateway {
  constructor(private readonly sessionsService: SessionsService) {}

  @SubscribeMessage('createSession')
  create(@MessageBody() createSessionDto: CreateSessionDto) {
    return this.sessionsService.create(createSessionDto);
  }

  @SubscribeMessage('findAllSessions')
  findAll() {
    return this.sessionsService.findAll();
  }

  @SubscribeMessage('findOneSession')
  findOne(@MessageBody() id: number) {
    return this.sessionsService.findOne(id);
  }

  @SubscribeMessage('updateSession')
  update(@MessageBody() updateSessionDto: UpdateSessionDto) {
    return this.sessionsService.update(updateSessionDto.id, updateSessionDto);
  }

  @SubscribeMessage('removeSession')
  remove(@MessageBody() id: number) {
    return this.sessionsService.remove(id);
  }
}
