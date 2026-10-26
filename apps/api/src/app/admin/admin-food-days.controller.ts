import { Body, Controller, Delete, Get, HttpCode, Param, ParseUUIDPipe, Patch, Post, Req, UseGuards } from '@nestjs/common';
import {
  createFoodDaySchema,
  CreateFoodDayInput,
  occurrenceOverrideSchema,
  updateFoodDaySchema,
  UpdateFoodDayInput,
} from '@cc/contracts';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { AdminFoodDaysService } from './admin-food-days.service';
import { AdminGuard, AdminRequest, Roles } from './auth.guard';

@Controller('admin/food-days')
@UseGuards(AdminGuard)
export class AdminFoodDaysController {
  constructor(private readonly service: AdminFoodDaysService) {}

  @Get()
  list() {
    return this.service.list();
  }

  @Get(':id')
  get(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.get(id);
  }

  @Post()
  create(@Req() req: AdminRequest, @Body(new ZodValidationPipe(createFoodDaySchema)) body: CreateFoodDayInput) {
    return this.service.create(req.admin!.sub, body);
  }

  @Patch(':id')
  update(
    @Req() req: AdminRequest,
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(updateFoodDaySchema)) body: UpdateFoodDayInput,
  ) {
    return this.service.update(req.admin!.sub, id, body);
  }

  @Delete(':id')
  @Roles('admin')
  @HttpCode(204)
  async remove(@Req() req: AdminRequest, @Param('id', ParseUUIDPipe) id: string) {
    await this.service.remove(req.admin!.sub, id);
  }

  @Post(':id/occurrences')
  setOccurrence(
    @Req() req: AdminRequest,
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(occurrenceOverrideSchema)) body: { year: number; date: string; isConfirmed: boolean },
  ) {
    return this.service.setOccurrence(req.admin!.sub, id, body);
  }
}
