import { CurrentUser } from '@shared/decorator/user.decorator';
import { AuthGuard } from '@modules/auth/guard/auth.guard';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CreateTaskDto } from './dto/create-task.dto';
import { QueryTaskDto } from './dto/query-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { TasksService } from './tasks.service';

@ApiTags('tasks')
@ApiBearerAuth('token')
@UseGuards(AuthGuard)
@Controller('v1/tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  @ApiOperation({ summary: 'Create a task' })
  create(
    @Body() createTaskDto: CreateTaskDto,
    @CurrentUser('userId') userId: number,
  ) {
    return this.tasksService.create(createTaskDto, userId);
  }

  @Get()
  @ApiOperation({ summary: 'Get the current user tasks' })
  findAll(
    @Query() queryTaskDto: QueryTaskDto,
    @CurrentUser('userId') userId: number,
  ) {
    return this.tasksService.findAll(userId, queryTaskDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a task by ID' })
  findOne(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @CurrentUser('userId') userId: number,
  ) {
    return this.tasksService.findOne(id, userId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a task' })
  update(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() updateTaskDto: UpdateTaskDto,
    @CurrentUser('userId') userId: number,
  ) {
    return this.tasksService.update(id, userId, updateTaskDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a task' })
  remove(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @CurrentUser('userId') userId: number,
  ) {
    return this.tasksService.remove(id, userId);
  }
}
