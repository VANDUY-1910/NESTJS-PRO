import { Task } from '@database/typeorm/entities/tasks.entity';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository } from 'typeorm';
import { CreateTaskDto } from './dto/create-task.dto';
import { QueryTaskDto } from './dto/query-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private readonly taskRepository: Repository<Task>,
  ) {}

  async create(createTaskDto: CreateTaskDto, userId: number): Promise<Task> {
    const task = this.taskRepository.create({
      ...createTaskDto,
      userId,
    });

    return this.taskRepository.save(task);
  }

  async findAll(userId: number, queryTaskDto: QueryTaskDto): Promise<Task[]> {
    const where: FindOptionsWhere<Task> = { userId };

    if (queryTaskDto.isCompleted !== undefined) {
      where.isCompleted = queryTaskDto.isCompleted;
    }

    if (queryTaskDto.category !== undefined) {
      where.category = queryTaskDto.category;
    }

    return this.taskRepository.find({
      where,
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string, userId: number): Promise<Task> {
    const task = await this.taskRepository.findOneBy({ id, userId });

    if (!task) {
      throw new NotFoundException('TASK-404');
    }

    return task;
  }

  async update(
    id: string,
    userId: number,
    updateTaskDto: UpdateTaskDto,
  ): Promise<Task> {
    if (Object.keys(updateTaskDto).length === 0) {
      return this.findOne(id, userId);
    }

    const result = await this.taskRepository.update(
      { id, userId },
      updateTaskDto,
    );

    if (!result.affected) {
      throw new NotFoundException('TASK-404');
    }

    return this.findOne(id, userId);
  }

  async remove(id: string, userId: number): Promise<void> {
    const result = await this.taskRepository.delete({ id, userId });

    if (!result.affected) {
      throw new NotFoundException('TASK-404');
    }
  }
}
