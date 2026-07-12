import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NikePlusActivityResponseDto } from './dto/nikeplus-activity-response.dto';

@Injectable()
export class NikePlusService {
  constructor(private readonly prisma: PrismaService) {}

  async listActivities(userId: string): Promise<NikePlusActivityResponseDto[]> {
    const activities = await this.prisma.nikePlusActivity.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
    });
    return activities.map((activity) => ({
      id: activity.id,
      title: activity.title,
      value: activity.value,
      unit: activity.unit,
    }));
  }
}
