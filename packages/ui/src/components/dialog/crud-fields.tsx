"use client";

import { Input } from '../shadcn/input';
import { Textarea } from '../shadcn/textarea';
import { Checkbox } from '../shadcn/checkbox';
import { RadioGroup, RadioGroupItem } from '../shadcn/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../shadcn/select';
import { Label } from '../shadcn/label';
import { Button } from '../shadcn/button';
import { Eye, EyeClosed } from 'lucide-react';
import type { UseFormReturn } from 'react-hook-form';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '../shadcn/form';
import { useState } from 'react';

export type TypeFields = {
    name: string
    label: string
    type: 'text' | 'textarea' | 'date' | 'number' | 'select' | 'radio' | 'checkbox' | 'password' | 'time'
    required?: boolean
    options?: { value: string; label: string }[]
    multiple?: boolean
    placeholder?: string
    maxLength?: number
    step?: string
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
        switch (field.type) {
            case 'text':
            case 'date':
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
                                        disabled={isView}
                                        placeholder={field.placeholder}
                                        className={className}
                                        value={toString(formField.value)}
                                        onChange={formField.onChange}
                                        onBlur={formField.onBlur}
                                        name={formField.name}
                                        ref={formField.ref}
                                    />
                                </FormControl>
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
                                            onBlur={formField.onBlur}
                                            name={formField.name}
                                            ref={formField.ref}
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
                                        onBlur={formField.onBlur}
                                        name={formField.name}
                                        ref={formField.ref}
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
                                                onBlur={formField.onBlur}
                                                name={formField.name}
                                                ref={formField.ref}
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

            case 'radio':
                if (!field.options) {
                    console.warn(`Radio field "${field.name}" needs options`);
                    return null;
                }

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
                                    <RadioGroup
                                        value={formField.value as string}
                                        onValueChange={formField.onChange}
                                        disabled={isView}
                                        className="flex flex-row space-y-2"
                                    >
                                        {field && field.options && field.options.map((option) => (
                                            <div key={option.value} className="flex items-center space-x-2">
                                                <RadioGroupItem
                                                    value={option.value}
                                                    id={`${field.name}-${option.value}`}
                                                    className="text-blue-600 border-gray-400"
                                                />
                                                <Label
                                                    htmlFor={`${field.name}-${option.value}`}
                                                    className="text-sm text-gray-300 cursor-pointer"
                                                >
                                                    {option.label}
                                                </Label>
                                            </div>
                                        ))}
                                    </RadioGroup>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
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
                                                onBlur={formField.onBlur}
                                                name={formField.name}
                                                ref={formField.ref}
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

            case 'checkbox':
                // Caso especial: checkbox simple (booleano)
                if (!field.options) {
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
                                        <div className="flex items-center justify-center space-x-2">
                                            <Checkbox
                                                id={field.name}
                                                checked={formField.value as boolean}
                                                onCheckedChange={formField.onChange}
                                                disabled={isView}
                                                className="text-blue-600 border-gray-400 data-[state=checked]:bg-blue-600"
                                            />
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    );
                }

                // Caso: múltiples checkboxes (array)
                return (
                    <FormField
                        control={form.control}
                        name={field.name}
                        render={({ field: formField }) => {
                            const currentValue = formField.value as string[] || [];

                            const handleCheckboxChange = (optionValue: string, checked: boolean) => {
                                let newValue: string[];

                                if (checked) {
                                    newValue = [...currentValue, optionValue];
                                } else {
                                    newValue = currentValue.filter(val => val !== optionValue);
                                }

                                formField.onChange(newValue);
                            };

                            return (
                                <FormItem>
                                    <FormLabel>
                                        {field.label} {field.required && '*'}
                                    </FormLabel>
                                    <FormControl>
                                        <div className="space-y-3">
                                            {field && field.options && field.options.map((option) => (
                                                <div key={option.value} className="flex flex-row space-x-2">
                                                    <Checkbox
                                                        id={`${field.name}-${option.value}`}
                                                        name={field.name}
                                                        value={option.value}
                                                        checked={currentValue.includes(option.value)}
                                                        onCheckedChange={(checked) =>
                                                            handleCheckboxChange(option.value, checked as boolean)
                                                        }
                                                        disabled={isView}
                                                        className="text-blue-600 border-gray-400 data-[state=checked]:bg-blue-600"
                                                    />
                                                    <Label
                                                        htmlFor={`${field.name}-${option.value}`}
                                                        className="text-sm text-gray-300 cursor-pointer"
                                                    >
                                                        {option.label}
                                                    </Label>
                                                </div>
                                            ))}
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            );
                        }}
                    />
                );

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