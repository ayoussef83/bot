import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole, UserStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findByEmail(email: string) {
    return this.prisma.users.findUnique({
      where: { email, deletedAt: null },
    });
  }

  async findById(id: string) {
    return this.prisma.users.findUnique({
      where: { id, deletedAt: null },
    });
  }

  async create(data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role: UserRole;
  }) {
    const hashedPassword = await bcrypt.hash(data.password, 10);
    return this.prisma.users.create({
      data: {
        ...data,
        password: hashedPassword,
      },
    });
  }

  async findAll() {
    return this.prisma.users.findMany({
      where: { deletedAt: null },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async update(id: string, data: Partial<{
    firstName: string;
    lastName: string;
    email: string;
    role: UserRole;
    status: UserStatus;
    password: string;
  }>) {
    if (data.password) {
      data.password = await bcrypt.hash(data.password, 10);
    }

    return this.prisma.users.update({
      where: { id },
      data,
    });
  }

  async softDelete(id: string) {
    return this.prisma.users.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async getInstructorProfile(userId: string) {
    return this.prisma.instructors.findUnique({
      where: { userId },
    });
  }
}

