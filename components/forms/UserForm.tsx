"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import {
  createUserSchema,
  updateUserSchema,
  type CreateUserInput,
  type UpdateUserInput,
} from "@/lib/validations/user"
import { createUser, updateUser } from "@/lib/actions/users"
import type { UserRow } from "@/lib/actions/users"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface UserFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user?: UserRow | null
  onSuccess?: () => void
}

export function UserForm({
  open,
  onOpenChange,
  user,
  onSuccess,
}: UserFormProps) {
  const isEdit = !!user
  const [serverError, setServerError] = useState<string | null>(null)

  const form = useForm<CreateUserInput | UpdateUserInput>({
    resolver: zodResolver(isEdit ? updateUserSchema : createUserSchema),
    defaultValues: {
      nama: "",
      email: "",
      password: "",
      role: "pegawai",
    },
  })

  // Isi form saat edit
  useEffect(() => {
    if (user) {
      form.reset({
        nama: user.nama ?? "",
        role: user.role,
        password: "",
      })
    } else {
      form.reset({ nama: "", email: "", password: "", role: "pegawai" })
    }
    setServerError(null)
  }, [user, open, form])

  const onSubmit = async (data: CreateUserInput | UpdateUserInput) => {
    setServerError(null)
    let result: { error?: string }

    if (isEdit) {
      result = await updateUser(user!.id, data as UpdateUserInput)
    } else {
      result = await createUser(data as CreateUserInput)
    }

    if (result.error) {
      setServerError(result.error)
      return
    }

    toast.success(isEdit ? "User berhasil diperbarui" : "User berhasil dibuat")
    onOpenChange(false)
    onSuccess?.()
  }

  const { formState: { isSubmitting } } = form

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit User" : "Tambah User"}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {serverError && (
              <div className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">
                {serverError}
              </div>
            )}

            <FormField
              control={form.control}
              name="nama"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nama</FormLabel>
                  <FormControl>
                    <Input placeholder="Nama lengkap" disabled={isSubmitting} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {!isEdit && (
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="email@contoh.com"
                        disabled={isSubmitting}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Password{isEdit && " (kosongkan jika tidak diubah)"}
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder={isEdit ? "••••••••" : "Min. 8 karakter"}
                      disabled={isSubmitting}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger className="w-full" disabled={isSubmitting}>
                      <SelectValue placeholder="Pilih role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="pegawai">Pegawai</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-3 justify-end pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Batal
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {isSubmitting ? "Menyimpan..." : "Simpan"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
