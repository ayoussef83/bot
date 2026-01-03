import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCourseDto, CreateCourseLevelDto, UpdateCourseDto, UpdateCourseLevelDto } from './dto';

@Injectable()
export class CoursesService {
  constructor(private readonly prisma: PrismaService) {}

  async createCourse(dto: CreateCourseDto) {
    const name = dto.name?.trim();
    if (!name) throw new BadRequestException('Course name is required');
    return this.prisma.courses.create({
      data: { name, isActive: dto.isActive ?? true },
    });
  }

  async listCourses() {
    return this.prisma.courses.findMany({
      where: { deletedAt: null },
      include: {
        levels: {
          where: { deletedAt: null },
          orderBy: { sortOrder: 'asc' },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async getCourse(id: string) {
    const course = await this.prisma.courses.findFirst({
      where: { id, deletedAt: null },
      include: {
        levels: { where: { deletedAt: null }, orderBy: { sortOrder: 'asc' } },
      },
    });
    if (!course) throw new NotFoundException('Course not found');
    return course;
  }

  async updateCourse(id: string, dto: UpdateCourseDto) {
    const existing = await this.prisma.courses.findFirst({ where: { id, deletedAt: null } });
    if (!existing) throw new NotFoundException('Course not found');
    return this.prisma.courses.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
        ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
      },
    });
  }

  async deleteCourse(id: string) {
    const existing = await this.prisma.courses.findFirst({ where: { id, deletedAt: null } });
    if (!existing) throw new NotFoundException('Course not found');
    return this.prisma.courses.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  async createLevel(dto: CreateCourseLevelDto) {
    const course = await this.prisma.courses.findFirst({ where: { id: dto.courseId, deletedAt: null } });
    if (!course) throw new NotFoundException('Course not found');
    const name = dto.name?.trim();
    if (!name) throw new BadRequestException('Level name is required');
    return this.prisma.courses_levels.create({
      data: {
        courseId: dto.courseId,
        name,
        sortOrder: dto.sortOrder ?? 1,
        isActive: dto.isActive ?? true,
      },
    });
  }

  async updateLevel(id: string, dto: UpdateCourseLevelDto) {
    const existing = await this.prisma.courses_levels.findFirst({ where: { id, deletedAt: null } });
    if (!existing) throw new NotFoundException('Course level not found');
    return this.prisma.courses_levels.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
        ...(dto.sortOrder !== undefined ? { sortOrder: dto.sortOrder } : {}),
        ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
      },
    });
  }

  async deleteLevel(id: string) {
    const existing = await this.prisma.courses_levels.findFirst({ where: { id, deletedAt: null } });
    if (!existing) throw new NotFoundException('Course level not found');
    return this.prisma.courses_levels.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  // For dropdowns
  async listLevels() {
    // Backfill: ensure courses/levels exist for existing course groups (classes) like "Python", "Lego Mindstorm".
    // This keeps dropdowns working even if older data was created before the Course/CourseLevel tables existed.
    const classNames = await this.prisma.classes.findMany({
      where: { deletedAt: null },
      select: { name: true },
      distinct: ['name'],
    });
    for (const row of classNames) {
      const name = (row?.name || '').trim();
      if (!name) continue;
      const course = await this.prisma.courses.upsert({
        where: { name },
        update: { deletedAt: null, isActive: true },
        create: { name, isActive: true },
      });
      await this.prisma.courses_levels.upsert({
        where: { courseId_name: { courseId: course.id, name: 'Level 1' } },
        update: { deletedAt: null, isActive: true, sortOrder: 1 },
        create: { courseId: course.id, name: 'Level 1', sortOrder: 1, isActive: true },
      });
    }

    return this.prisma.courses_levels.findMany({
      where: { deletedAt: null, courses: { deletedAt: null } },
      include: { courses: true },
      orderBy: [{ courses: { name: 'asc' } }, { sortOrder: 'asc' }],
    });
  }
}


