import {
  Contains,
  Equals,
  IsAlphanumeric,
  IsArray,
  IsBoolean,
  IsCreditCard,
  IsDateString,
  IsDefined,
  IsDivisibleBy,
  IsEmpty,
  IsEnum,
  IsHexColor,
  IsIn,
  IsInt,
  IsLatLong,
  IsNegative,
  IsNotEmpty,
  IsNotIn,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
  NotContains,
  NotEquals,
  registerDecorator,
  Validate,
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

enum MovieGenre {
  a = 'a',
  b = 'b',
  c = 'c',
}

@ValidatorConstraint()
class passwordValidator implements ValidatorConstraintInterface {
  validate(value: any, validationArguments?: ValidationArguments): Promise<boolean> | boolean {
    //비밀번호 길이는 4-8
    return value.length > 4 && value.length < 8;
  }
  defaultMessage?(validationArguments?: ValidationArguments): string {
    return '비밀길이 4-8이어야한다 ($value)';
  }
}
function IsPasswordValid(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'IsPasswordValid', // ✅ 일치시켜야 함
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: passwordValidator,
    });
  };
}

export class UpdateMovieDto {
  @IsNotEmpty()
  @IsOptional()
  title?: string;

  @IsNotEmpty()
  @IsOptional()
  genre?: string;

  // null || undifined
  // @IsDefined()

  // @IsDefined()
  // @IsOptional()

  // @Equals('code')

  // @NotEquals('code')

  // null || undifined | ''
  //@IsEmpty()

  //@IsNotEmpty

  //@IsIn(['action','fantasy'])

  //@IsNotIn(['action','fantasy'])

  //@IsBoolean()

  //@IsString()

  //@IsNumber()

  //@IsInt()

  //@IsArray()

  //@IsEnum(MovieGenre)

  //@IsDateString()

  //@IsDivisibleBy(5)

  //@IsPositive()

  //@IsNegative()

  //@Min(20)
  //@Max(100)

  //@Contains('코')
  //@NotContains('코')

  //@IsAlphanumeric()

  //@IsCreditCard

  //@IsHexColor()

  //@MinLength(3)
  //@MaxLength(11)

  //@IsUUID()

  //@IsLatLong()

  //@Validate(passwordValidator)

  @IsPasswordValid()
  test: string;
}
