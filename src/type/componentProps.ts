import type { ButtonHTMLAttributes, InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes, ReactNode } from "react";

export type ButtonVariant = "primary" | "secondary" | "danger";

export type ButtonProps = {
  children: ReactNode;
  variant?: ButtonVariant;
} & ButtonHTMLAttributes<HTMLButtonElement>;

export type InputProps = InputHTMLAttributes<HTMLInputElement>;

export type LabelProps = {
  children: ReactNode;
  htmlFor?: string;
  required?: boolean;
  className?: string;
};

export type SelectProps = SelectHTMLAttributes<HTMLSelectElement>;

export type TextAreaProps = TextareaHTMLAttributes<HTMLTextAreaElement>;

export type SpinnerProps = {
  text?: string;
};

export type StatusMessageProps = {
  message: string;
};

export type PageSectionProps = {
  title: string;
  children: ReactNode;
};

export type ExcelRow = Record<string, unknown>;
