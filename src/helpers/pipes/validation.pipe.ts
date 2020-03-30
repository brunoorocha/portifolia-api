import { PipeTransform, ArgumentMetadata, BadRequestException } from "@nestjs/common";
import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';

export class ValidationPipe implements PipeTransform<any> {
  async transform (value: any, { metatype }: ArgumentMetadata) {
    if (!metatype || !this.toValidate(metatype)) {
      return value;
    }

    const object = plainToClass(metatype, value);
    const errors = await validate(object);

    if (errors.length > 0) {
      throw new BadRequestException('Validation Failed');
    }

    return value;
  }

  private toValidate (metatype: Function): boolean {
    const types: Function[] = [String, Boolean, Array, Number, Array, Object];
    return types.includes(metatype);
  }
}
