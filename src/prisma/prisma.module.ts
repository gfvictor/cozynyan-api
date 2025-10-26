import { Global, Module } from "@nestjs/common";
import { PrismaService } from "./prisma.service";

@Global()
@Module({
  providers: [PrismaModule],
  exports: [PrismaService],
})
export class PrismaModule {}
