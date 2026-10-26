import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AdminFoodDaysController } from './admin-food-days.controller';
import { AdminFoodDaysService } from './admin-food-days.service';
import { AdminGuard } from './auth.guard';
import { AuthController } from './auth.controller';

@Module({
  imports: [
    JwtModule.registerAsync({
      useFactory: () => {
        const secret = process.env['JWT_SECRET'];
        if (!secret) throw new Error('Falta JWT_SECRET');
        return { secret };
      },
    }),
  ],
  controllers: [AuthController, AdminFoodDaysController],
  providers: [AdminFoodDaysService, AdminGuard],
})
export class AdminModule {}
