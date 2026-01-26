// Request validation middleware using Joi
import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { ValidationError } from '../utils/error-types';

interface ValidationSchema {
    body?: Joi.ObjectSchema;
    query?: Joi.ObjectSchema;
    params?: Joi.ObjectSchema;
}

export const validate = (schema: ValidationSchema) => {
    return (req: Request, _res: Response, next: NextFunction) => {
        const errors: string[] = [];

        if (schema.body) {
            const { error } = schema.body.validate(req.body, { abortEarly: false });
            if (error) {
                errors.push(...error.details.map((d: any) => d.message));
            }
        }

        if (schema.query) {
            const { error } = schema.query.validate(req.query, { abortEarly: false });
            if (error) {
                errors.push(...error.details.map((d: any) => d.message));
            }
        }

        if (schema.params) {
            const { error } = schema.params.validate(req.params, { abortEarly: false });
            if (error) {
                errors.push(...error.details.map((d: any) => d.message));
            }
        }

        if (errors.length > 0) {
            return next(new ValidationError(errors.join('; ')));
        }

        next();
    };
};
