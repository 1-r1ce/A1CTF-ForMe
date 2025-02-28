"use client";

import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { ChangeEvent, Dispatch, SetStateAction, useEffect, useRef, useState } from "react";
import { Textarea } from "../ui/textarea";
import api from "@/utils/GZApi";
import { AxiosError } from "axios";
import { toast } from "sonner";
import { CircleAlert, FileUp, Upload } from "lucide-react";
import { useTranslations } from "next-intl";

interface ErrorMessage {
    status: number;
    title: string;
}

export type DialogOption = { 
    onConfirm?: () => void, onCancel?: () => void, isOpen: boolean, message: string, title?: string
}

export type DialogSettings = {
    settings: DialogOption;
    setSettings: Dispatch<SetStateAction<DialogOption>>
}

export const ConfirmDialog: React.FC<DialogSettings> = ({ settings: {
    onConfirm, onCancel, isOpen, message, title = "Are you sure"
}, setSettings }) => {

    const t = useTranslations("teams")

    const setIsOpen = (status: boolean) => {
        setSettings((prev) => (
            {
                ...prev,
                isOpen: status
            }
        ))
    }

    return (
        <Dialog open={isOpen} onOpenChange={(status) => {
            setIsOpen(status)
            if (!status) {
                if (onCancel) onCancel()
            }
        }}>
            <DialogTrigger asChild>

            </DialogTrigger>
            <DialogContent className="sm:max-w-[525px] select-none"
                onInteractOutside={(e) => e.preventDefault()}
            >
                <DialogHeader>
                    <DialogTitle>{ title }</DialogTitle>
                </DialogHeader>
                <div className="w-full flex gap-2 items-center">
                    <CircleAlert className="stroke-red-500" /> 
                    <span>{ message }</span>
                </div>
                <div className="flex gap-2">
                    <div className="flex-1" />
                    <Button variant="destructive"
                        onClick={() => {
                            setIsOpen(false)
                            if (onConfirm) onConfirm()
                        }}
                    >{ t("continue_button") }</Button>
                    <Button variant="ghost"
                        onClick={() => {
                            setIsOpen(false)
                            if (onCancel) onCancel()
                        }}
                    >{ t("cancel_button") }</Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}