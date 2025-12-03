"use client";

import { Input } from '../shadcn/input';
import { Textarea } from '../shadcn/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../shadcn/select';
import { Button } from '../shadcn/button';
import { Eye, EyeClosed } from 'lucide-react';
import type { UseFormReturn } from 'react-hook-form';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '../shadcn/form';
import { useState } from 'react';

export type TypeFields = {
    name: string
    label: string
    type: 'text' | 'textarea' | 'date' | 'number' | 'select' | 'password' | 'time' | 'email' | 'tel'
    required?: boolean
    options?: { value: string; label: string }[]
    multiple?: boolean
    placeholder?: string
    maxLength?: number
    step?: string
    min?: number
    max?: number
    disabled?: boolean | ((operation: string) => boolean)
    readOnly?: boolean
    helperText?: string
    className?: string
    // Para campos condicionales
    showCondition?: (formValues: Record<string, unknown>) => boolean
}[]

interface CrudFieldsProps {
    fields: TypeFields
    operation: 'create' | 'edit' | 'delete' | 'view'
    form: UseFormReturn<Record<string, unknown>>
    className?: string;
}

export default function CrudFields({ fields, operation, form, className }: CrudFieldsProps) {
    const isView = operation === 'view';
    const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});

    const togglePasswordVisibility = (fieldName: string) => {
        setVisiblePasswords(prev => ({
            ...prev,
            [fieldName]: !prev[fieldName]
        }));
    };

    // Función helper para convertir unknown a string de forma segura
    const toString = (value: unknown): string => {
        if (value === null || value === undefined) {
            return '';
        }
        if (typeof value === 'string') {
            return value;
        }
        if (typeof value === 'number') {
            return value.toString();
        }
        if (typeof value === 'boolean') {
            return value.toString();
        }
        return String(value);
    };

    const renderField = (field: typeof fields[0]) => {
        const isDisabled = typeof field.disabled === 'function'
            ? field.disabled(operation)
            : field.disabled || isView;

        const shouldShow = field.showCondition
            ? field.showCondition(form.getValues())
            : true;

        if (!shouldShow) return null;

        switch (field.type) {
            case 'text':
            case 'date':
            case 'email':
            case 'tel':
                return (
                    <FormField
                        control={form.control}
                        name={field.name}
                        render={({ field: formField }) => (
                            <FormItem>
                                <FormLabel>
                                    {field.label} {field.required && '*'}
                                </FormLabel>
                                <FormControl>
                                    <Input
                                        type={field.type}
                                        {...formField}
                                        required={field.required}
                                        disabled={isView || isDisabled}
                                        placeholder={field.placeholder}
                                        className={className}
                                        value={toString(formField.value)}
                                        onChange={formField.onChange}
                                        name={formField.name}
                                    />
                                </FormControl>
                                {field.helperText && (
                                    <p className="text-xs text-muted-foreground">
                                        {field.helperText}
                                    </p>
                                )}
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                )
            case 'number':
                return (
                    <FormField
                        control={form.control}
                        name={field.name}
                        render={({ field: formField }) => {
                            // Convertir valor a string para el input
                            const inputValue = formField.value === null || formField.value === undefined
                                ? ""
                                : String(formField.value);

                            return (
                                <FormItem>
                                    <FormLabel>
                                        {field.label} {field.required && '*'}
                                    </FormLabel>
                                    <FormControl>
                                        <Input
                                            type="number"
                                            step={field.step || "0.1"}
                                            required={field.required}
                                            disabled={isView}
                                            placeholder={field.placeholder}
                                            className={className}
                                            value={inputValue}
                                            onChange={(e) => {
                                                const value = e.target.value;
                                                // Convertir string vacío a undefined/null, de lo contrario a número
                                                if (value === "") {
                                                    formField.onChange(null);
                                                } else {
                                                    const numValue = Number(value);
                                                    // Solo pasar si es un número válido
                                                    if (!isNaN(numValue)) {
                                                        formField.onChange(numValue);
                                                    } else {
                                                        formField.onChange(value);
                                                    }
                                                }
                                            }}
                                            name={formField.name}
                                            min={field.min}
                                            max={field.max}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            );
                        }}
                    />
                );

            // En tu CrudFields, agregar un caso para tipo 'time'
            case 'time':
                return (
                    <FormField
                        control={form.control}
                        name={field.name}
                        render={({ field: formField }) => (
                            <FormItem>
                                <FormLabel>
                                    {field.label} {field.required && '*'}
                                </FormLabel>
                                <FormControl>
                                    <Input
                                        type="time"
                                        {...formField}
                                        required={field.required}
                                        disabled={isView}
                                        placeholder={field.placeholder}
                                        className={className}
                                        value={toString(formField.value)}
                                        onChange={formField.onChange}
                                        name={formField.name}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                );

            case 'password':
                return (
                    <FormField
                        control={form.control}
                        name={field.name}
                        render={({ field: formField }) => {
                            const isPasswordVisible = visiblePasswords[field.name] || false;
                            return (
                                <FormItem>
                                    <FormLabel>
                                        {field.label} {field.required && '*'}
                                    </FormLabel>
                                    <FormControl>
                                        <div className='relative'>
                                            <Input
                                                type={isPasswordVisible ? 'text' : 'password'}
                                                {...formField}
                                                required={field.required}
                                                disabled={isView}
                                                placeholder={field.placeholder}
                                                className={className}
                                                value={toString(formField.value)}
                                                onChange={formField.onChange}
                                                name={formField.name}
                                            />
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                                onClick={() => togglePasswordVisibility(field.name)}
                                            >
                                                {isPasswordVisible ? (
                                                    <EyeClosed className="h-4 w-4 text-gray-400" />
                                                ) : (
                                                    <Eye className="h-4 w-4 text-gray-400" />
                                                )}
                                            </Button>
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            );
                        }}
                    />
                )

            case 'textarea':
                return (
                    <FormField
                        control={form.control}
                        name={field.name}
                        render={({ field: formField }) => {
                            const value = formField.value as string || '';
                            const maxLength = field.maxLength || 500;
                            const charCount = value.length;
                            const isNearLimit = charCount > maxLength * 0.8;

                            return (
                                <FormItem>
                                    <FormLabel>
                                        {field.label} {field.required && '*'}
                                    </FormLabel>
                                    <FormControl>
                                        <div className="relative">
                                            <Textarea
                                                {...formField}
                                                required={field.required}
                                                disabled={isView}
                                                placeholder={field.placeholder}
                                                rows={3}
                                                className={`bg-gray-800 min-h-[80px] resize-none resize-none pr-20 ${charCount > maxLength ? 'border-red-500' : ''
                                                    }`}
                                                maxLength={maxLength}
                                                value={toString(formField.value)}
                                                onChange={formField.onChange}
                                                name={formField.name}
                                            />
                                            <div className={`absolute bottom-2 right-2 text-xs ${charCount > maxLength
                                                ? 'text-red-400'
                                                : isNearLimit
                                                    ? 'text-yellow-400'
                                                    : 'text-gray-400'
                                                }`}>
                                                {charCount}/{maxLength}
                                            </div>
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            );
                        }}
                    />
                )

            case 'select':
                return (
                    <FormField
                        control={form.control}
                        name={field.name}
                        render={({ field: formField }) => (
                            <FormItem>
                                <FormLabel>
                                    {field.label} {field.required && '*'}
                                </FormLabel>
                                <FormControl>
                                    <Select
                                        value={formField.value as string}
                                        onValueChange={formField.onChange}
                                        disabled={isView}
                                    >
                                        <SelectTrigger /* className="bg-gray-800 border-gray-700 text-white" */>
                                            <SelectValue placeholder={field.placeholder || "Seleccionar..."} />
                                        </SelectTrigger>
                                        <SelectContent /* className="bg-gray-800 border-gray-700 text-white" */>
                                            {field.options!.map((option) => (
                                                <SelectItem
                                                    key={option.value}
                                                    value={option.value}
                                                // className="focus:bg-gray-700 focus:text-white"
                                                >
                                                    {option.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                )

            default:
                return null;
        }
    };

    return (
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            {fields.map(field => (
                <div
                    key={field.name}
                    className={field.type === 'textarea' ? 'md:col-span-2' : ''}
                >
                    {renderField(field)}
                </div>
            ))}
        </div>
    );
}

// al entrar al sistema desde vercel se redirige al localhost, en vez del dominio de vercel; urgente
// quitar campos del form de personal / tutor de contraseña temporal y teléfono, revisar con Emilio; normal