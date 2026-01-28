"use client"

import * as React from "react"
import { Shell } from "@/components/ui/shell"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    IconUser,
    IconCalendar,
    IconSchool,
    IconDeviceFloppy,
    IconPlus,
    IconTrash,
    IconPencil,
    IconCheck,
    IconClock,
    IconSparkles,
    IconEye,
    IconEyeOff,
    IconPalette
} from "@tabler/icons-react"
import { useStore } from "@/components/providers/store-provider"
import { toast } from "sonner"
import { signOut } from "next-auth/react"
import { IconLogout } from "@tabler/icons-react"
import { useTheme } from "next-themes"
import { themes } from "@/lib/themes"
import { cn } from "@/lib/utils"

export default function SettingsPage() {
    const {
        settings,
        semesters,
        subjects,
        currentSemester,
        updateSettings,
        addSemester,
        updateSemester,
        deleteSemester,
        setCurrentSemester,
        addSubject,
        updateSubject,
        deleteSubject
    } = useStore()

    // Profile State
    const [displayName, setDisplayName] = React.useState("")
    const [email, setEmail] = React.useState("")
    const [avatarUrl, setAvatarUrl] = React.useState("")
    const [department, setDepartment] = React.useState("")
    const [focusDuration, setFocusDuration] = React.useState(25)
    const [breakDuration, setBreakDuration] = React.useState(5)
    const [emailNotifications, setEmailNotifications] = React.useState(false)
    const [notificationEmail, setNotificationEmail] = React.useState("")
    const [groqApiKey, setGroqApiKey] = React.useState("")
    const [resendApiKey, setResendApiKey] = React.useState("")
    const [showApiKey, setShowApiKey] = React.useState(false)

    // Semester Dialog
    const [semDialogOpen, setSemDialogOpen] = React.useState(false)
    const [semName, setSemName] = React.useState("")
    const [semStart, setSemStart] = React.useState("")
    const [semEnd, setSemEnd] = React.useState("")
    const [semIsCurrent, setSemIsCurrent] = React.useState(false)

    // Subject Dialog
    const [subDialogOpen, setSubDialogOpen] = React.useState(false)
    const [editingSubId, setEditingSubId] = React.useState<string | null>(null)
    const [subName, setSubName] = React.useState("")
    const [subCode, setSubCode] = React.useState("")
    const [subCredits, setSubCredits] = React.useState(3)
    const [subType, setSubType] = React.useState<"Theory" | "Lab" | "Embedded">("Theory")
    const [subSlot, setSubSlot] = React.useState("")
    const [subTeacher, setSubTeacher] = React.useState("")
    const [subTeacherEmail, setSubTeacherEmail] = React.useState("")
    const [subCabin, setSubCabin] = React.useState("")
    const [subLabRoom, setSubLabRoom] = React.useState("")
    const [subClassRoom, setSubClassRoom] = React.useState("")
    const { theme, setTheme } = useTheme()

    // Load settings
    React.useEffect(() => {
        if (settings) {
            setDisplayName(settings.displayName || "")
            setEmail(settings.email || "")
            setAvatarUrl(settings.avatarUrl || "")
            setDepartment(settings.department || "")
            setFocusDuration(settings.focusDuration || 25)
            setBreakDuration(settings.breakDuration || 5)
            setEmailNotifications(settings.emailNotifications || false)
            setNotificationEmail(settings.notificationEmail || "")
            setGroqApiKey(settings.groqApiKey || "")
            setResendApiKey(settings.resendApiKey || "")
        }
    }, [settings])

    const handleSaveProfile = () => {
        updateSettings({
            displayName,
            email,
            avatarUrl,
            department,
            focusDuration,
            breakDuration,
            emailNotifications,
            notificationEmail,
            groqApiKey,
            resendApiKey
        })
    }

    const handleAddSemester = (e: React.FormEvent) => {
        e.preventDefault()
        addSemester({
            name: semName,
            startDate: semStart,
            endDate: semEnd,
            isCurrent: semIsCurrent
        })
        setSemDialogOpen(false)
        setSemName("")
        setSemStart("")
        setSemEnd("")
        setSemIsCurrent(false)
    }

    const openSubjectDialog = (subject?: typeof subjects[0]) => {
        if (subject) {
            setEditingSubId(subject.id)
            setSubName(subject.name)
            setSubCode(subject.code)
            setSubCredits(subject.credits)
            setSubType(subject.type)
            setSubSlot(subject.slot || "")
            setSubTeacher(subject.teacherName || "")
            setSubTeacherEmail(subject.teacherEmail || "")
            setSubCabin(subject.cabinNo || "")
            setSubLabRoom(subject.labRoom || "")
            setSubClassRoom(subject.classRoom || "")
        } else {
            setEditingSubId(null)
            setSubName("")
            setSubCode("")
            setSubCredits(3)
            setSubType("Theory")
            setSubSlot("")
            setSubTeacher("")
            setSubTeacherEmail("")
            setSubCabin("")
            setSubLabRoom("")
            setSubClassRoom("")
        }
        setSubDialogOpen(true)
    }

    const handleSaveSubject = (e: React.FormEvent) => {
        e.preventDefault()
        const subjectData = {
            name: subName,
            code: subCode,
            credits: subCredits,
            type: subType,
            slot: subSlot,
            teacherName: subTeacher,
            teacherEmail: subTeacherEmail,
            cabinNo: subCabin,
            labRoom: subLabRoom,
            classRoom: subClassRoom,
            semesterId: currentSemester?.id
        }

        if (editingSubId) {
            updateSubject({ id: editingSubId, ...subjectData })
        } else {
            addSubject(subjectData)
        }
        setSubDialogOpen(false)
    }

    const currentSemSubjects = subjects.filter(s => s.semesterId === currentSemester?.id)

    return (
        <Shell>
            <div className="max-w-4xl mx-auto flex flex-col gap-8 pb-12">
                <div>
                    <h1 className="text-4xl font-normal tracking-tight text-on-surface">Settings</h1>
                    <p className="text-on-surface-variant mt-2 text-lg">Manage your profile, semesters, and subjects.</p>
                </div>

                <Tabs defaultValue="profile" className="w-full">
                    <TabsList className="grid w-full grid-cols-3 bg-surface-container-high rounded-[1.5rem] h-14 p-1">
                        <TabsTrigger value="profile" className="rounded-[1.2rem] h-12 text-base data-[state=active]:bg-surface data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all">Profile</TabsTrigger>
                        <TabsTrigger value="semesters" className="rounded-[1.2rem] h-12 text-base data-[state=active]:bg-surface data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all">Semesters</TabsTrigger>
                        <TabsTrigger value="subjects" className="rounded-[1.2rem] h-12 text-base data-[state=active]:bg-surface data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all">Subjects</TabsTrigger>
                    </TabsList>

                    {/* PROFILE TAB */}
                    <TabsContent value="profile" className="mt-6">
                        <Card className="border-none shadow-sm rounded-[2.5rem] bg-surface-container overflow-hidden">
                            <CardHeader className="p-8 pb-4">
                                <CardTitle className="flex items-center gap-3 text-2xl font-normal text-on-surface">
                                    <div className="p-2.5 bg-primary/10 rounded-xl text-primary">
                                        <IconUser className="w-6 h-6" />
                                    </div>
                                    Profile Settings
                                </CardTitle>
                                <CardDescription className="text-base text-on-surface-variant pl-14">Update your personal information and preferences.</CardDescription>
                            </CardHeader>
                            <CardContent className="p-8 pt-4 space-y-8">
                                <div className="grid gap-6 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="name" className="text-on-surface-variant pl-1">Display Name</Label>
                                        <Input id="name" value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="Your Name" className="h-12 rounded-xl bg-surface border-transparent" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="email" className="text-on-surface-variant pl-1">Email</Label>
                                        <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@university.edu" className="h-12 rounded-xl bg-surface border-transparent" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="dept" className="text-on-surface-variant pl-1">Department</Label>
                                        <Input id="dept" value={department} onChange={e => setDepartment(e.target.value)} placeholder="CSE" className="h-12 rounded-xl bg-surface border-transparent" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="avatar" className="text-on-surface-variant pl-1">Avatar URL</Label>
                                        <Input id="avatar" value={avatarUrl} onChange={e => setAvatarUrl(e.target.value)} placeholder="https://example.com/me.jpg" className="h-12 rounded-xl bg-surface border-transparent" />
                                    </div>
                                </div>

                                <div className="border-t border-border/10 pt-8">
                                    <h3 className="font-medium text-lg mb-6 flex items-center gap-2 text-on-surface">
                                        <IconPalette className="w-5 h-5 text-purple-500" /> Appearance
                                    </h3>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                                        {themes.map((t) => (
                                            <button
                                                key={t.value}
                                                onClick={() => setTheme(t.value)}
                                                className={cn(
                                                    "flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all duration-200 text-left relative overflow-hidden",
                                                    theme === t.value
                                                        ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                                                        : "border-border/40 hover:border-border/80 hover:bg-surface-container-high"
                                                )}
                                            >
                                                <div className={cn("h-10 w-10 rounded-full border shadow-sm", t.color)} />
                                                <div className="flex flex-col items-center z-10">
                                                    <span className="text-sm font-semibold text-on-surface">{t.name}</span>
                                                    {theme === t.value && (
                                                        <span className="text-[10px] text-primary font-bold uppercase tracking-wider mt-1">
                                                            Active
                                                        </span>
                                                    )}
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="border-t border-border/10 pt-8">
                                    <h3 className="font-medium text-lg mb-6 flex items-center gap-2 text-on-surface">
                                        <IconClock className="w-5 h-5 text-tertiary" /> Pomodoro Settings
                                    </h3>
                                    <div className="grid gap-6 md:grid-cols-2">
                                        <div className="space-y-2">
                                            <Label htmlFor="focus" className="text-on-surface-variant pl-1">Focus Duration (minutes)</Label>
                                            <Input id="focus" type="number" value={focusDuration} onChange={e => setFocusDuration(Number(e.target.value))} min={1} max={120} className="h-12 rounded-xl bg-surface border-transparent" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="break" className="text-on-surface-variant pl-1">Break Duration (minutes)</Label>
                                            <Input id="break" type="number" value={breakDuration} onChange={e => setBreakDuration(Number(e.target.value))} min={1} max={60} className="h-12 rounded-xl bg-surface border-transparent" />
                                        </div>
                                    </div>
                                </div>

                                {/* Notification Settings */}
                                <div className="border-t border-border/10 pt-8">
                                    <h3 className="font-medium text-lg mb-6 flex items-center gap-2 text-on-surface">
                                        <IconDeviceFloppy className="w-5 h-5 text-secondary" /> Email Notifications
                                    </h3>
                                    <div className="space-y-6">
                                        <div className="flex items-center gap-3 p-4 bg-surface rounded-2xl border border-transparent hover:border-border/20 transition-all">
                                            <input
                                                type="checkbox"
                                                id="notify"
                                                checked={emailNotifications}
                                                onChange={e => setEmailNotifications(e.target.checked)}
                                                className="w-5 h-5 accent-primary rounded-md"
                                            />
                                            <Label htmlFor="notify" className="text-base cursor-pointer">Enable daily email reminders (Due Today/Tomorrow)</Label>
                                        </div>
                                        {emailNotifications && (
                                            <div className="space-y-4 p-6 bg-surface-container-low rounded-[1.5rem] border border-transparent animate-in fade-in slide-in-from-top-2">
                                                <div className="space-y-2">
                                                    <Label htmlFor="notifyEmail" className="text-on-surface-variant pl-1">Notification Email</Label>
                                                    <div className="flex gap-2">
                                                        <Input
                                                            id="notifyEmail"
                                                            type="email"
                                                            value={notificationEmail}
                                                            onChange={e => setNotificationEmail(e.target.value)}
                                                            placeholder="Enter email for alerts..."
                                                            className="h-12 rounded-xl bg-surface border-transparent"
                                                        />
                                                        <Button
                                                            variant="outline"
                                                            onClick={async () => {
                                                                if (!notificationEmail) return toast.error("Enter an email first!")
                                                                toast.info("Sending test email...")
                                                                try {
                                                                    const res = await fetch('/api/notifications/test', {
                                                                        method: 'POST',
                                                                        body: JSON.stringify({ email: notificationEmail })
                                                                    })
                                                                    if (res.ok) toast.success("Test email sent!")
                                                                    else toast.error("Failed to send.")
                                                                } catch (e) { toast.error("Error sending email.") }
                                                            }}
                                                            className="h-12 px-6 rounded-xl border-border/40 hover:bg-surface-container-high"
                                                        >
                                                            Test
                                                        </Button>
                                                    </div>
                                                    <p className="text-sm text-on-surface-variant/70 pl-1 pt-1">
                                                        We&apos;ll send reminders here. Make sure it&apos;s valid!
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* API Settings */}
                                <div className="border-t border-border/10 pt-8">
                                    <h3 className="font-medium text-lg mb-6 flex items-center gap-2 text-on-surface">
                                        <IconSparkles className="w-5 h-5 text-amber-500" /> API Integrations
                                    </h3>
                                    <div className="space-y-6">
                                        {/* GROQ Key */}
                                        <div className="space-y-2">
                                            <Label htmlFor="apiKey" className="text-on-surface-variant pl-1">GROQ API Key</Label>
                                            <div className="flex gap-2">
                                                <div className="relative flex-1">
                                                    <Input
                                                        id="apiKey"
                                                        type={showApiKey ? "text" : "password"}
                                                        value={groqApiKey}
                                                        onChange={e => setGroqApiKey(e.target.value)}
                                                        placeholder="gsk_..."
                                                        className="h-12 rounded-xl bg-surface border-transparent pr-12"
                                                    />
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-lg hover:bg-surface-container-high"
                                                        onClick={() => setShowApiKey(!showApiKey)}
                                                    >
                                                        {showApiKey ? <IconEyeOff className="w-4 h-4" /> : <IconEye className="w-4 h-4" />}
                                                    </Button>
                                                </div>
                                            </div>
                                            <p className="text-sm text-on-surface-variant/70 pl-1 pt-1">
                                                Required for AI recommendations. Get it at <a href="https://console.groq.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">console.groq.com</a>
                                            </p>
                                        </div>

                                        {/* Resend Key */}
                                        <div className="space-y-2">
                                            <Label htmlFor="resendKey" className="text-on-surface-variant pl-1">Resend API Key</Label>
                                            <div className="flex gap-2">
                                                <div className="relative flex-1">
                                                    <Input
                                                        id="resendKey"
                                                        type="password"
                                                        value={resendApiKey}
                                                        onChange={e => setResendApiKey(e.target.value)}
                                                        placeholder="re_..."
                                                        className="h-12 rounded-xl bg-surface border-transparent"
                                                    />
                                                </div>
                                            </div>
                                            <p className="text-sm text-on-surface-variant/70 pl-1 pt-1">
                                                Required for email notifications. Get it at <a href="https://resend.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">resend.com</a>
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex justify-between items-center border-t border-border/10 pt-8">
                                    <Button onClick={handleSaveProfile} className="h-12 px-8 rounded-full shadow-lg shadow-primary/20 text-base font-medium">
                                        <IconDeviceFloppy className="w-5 h-5 mr-2" /> Save Changes
                                    </Button>

                                    <Button
                                        variant="ghost"
                                        onClick={() => signOut({ callbackUrl: '/auth/signin' })}
                                        className="h-12 px-6 rounded-full text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high"
                                    >
                                        <IconLogout className="w-5 h-5 mr-2" /> Sign Out
                                    </Button>
                                </div>

                                {/* Danger Zone */}
                                <div className="border-t border-border/10 pt-8 mt-4">
                                    <h3 className="font-medium text-error mb-4 flex items-center gap-2">
                                        <IconTrash className="w-5 h-5" /> Danger Zone
                                    </h3>
                                    <div className="rounded-[1.5rem] border border-error/20 bg-error/5 p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                        <div>
                                            <p className="font-medium text-error text-lg">Delete Account</p>
                                            <p className="text-sm text-error/70 mt-1 max-w-md">
                                                Permanently delete your account and all data. This action cannot be undone.
                                            </p>
                                        </div>
                                        <Dialog>
                                            <DialogTrigger asChild>
                                                <Button variant="destructive" className="rounded-full shadow-lg shadow-error/20">Delete Account</Button>
                                            </DialogTrigger>
                                            <DialogContent className="rounded-[2rem] border-none bg-surface-container p-8">
                                                <DialogHeader>
                                                    <DialogTitle className="text-xl">Are you absolutely sure?</DialogTitle>
                                                    <DialogDescription className="text-base pt-2">
                                                        This action cannot be undone. This will permanently delete your account and remove your data from our servers.
                                                    </DialogDescription>
                                                </DialogHeader>
                                                <DialogFooter className="mt-4">
                                                    <Button variant="outline" onClick={() => { }} className="rounded-full border-border/40">Cancel</Button>
                                                    <Button
                                                        variant="destructive"
                                                        onClick={async () => {
                                                            try {
                                                                const res = await fetch('/api/user', { method: 'DELETE' })
                                                                if (res.ok) {
                                                                    toast.success("Account deleted")
                                                                    signOut({ callbackUrl: '/auth/signin' })
                                                                } else {
                                                                    throw new Error("Failed")
                                                                }
                                                            } catch (e) {
                                                                toast.error("Failed to delete account")
                                                            }
                                                        }}
                                                        className="rounded-full"
                                                    >
                                                        Yes, delete my account
                                                    </Button>
                                                </DialogFooter>
                                            </DialogContent>
                                        </Dialog>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* SEMESTERS TAB */}
                    <TabsContent value="semesters" className="mt-6">
                        <Card className="border-none shadow-sm rounded-[2.5rem] bg-surface-container overflow-hidden">
                            <CardHeader className="flex flex-row items-center justify-between p-8 pb-4">
                                <div>
                                    <CardTitle className="flex items-center gap-3 text-2xl font-normal text-on-surface">
                                        <div className="p-2.5 bg-tertiary/10 rounded-xl text-tertiary">
                                            <IconCalendar className="w-6 h-6" />
                                        </div>
                                        Semesters
                                    </CardTitle>
                                    <CardDescription className="text-base text-on-surface-variant pl-14">Manage your academic semesters.</CardDescription>
                                </div>
                                <Dialog open={semDialogOpen} onOpenChange={setSemDialogOpen}>
                                    <DialogTrigger asChild>
                                        <Button className="rounded-full h-11 px-6 shadow-md"><IconPlus className="w-5 h-5 mr-2" /> Add Semester</Button>
                                    </DialogTrigger>
                                    <DialogContent className="rounded-[2rem] border-none bg-surface-container p-8">
                                        <DialogHeader>
                                            <DialogTitle className="text-xl">Add Semester</DialogTitle>
                                            <DialogDescription>Create a new academic semester.</DialogDescription>
                                        </DialogHeader>
                                        <form onSubmit={handleAddSemester} className="space-y-6 mt-2">
                                            <div className="space-y-2">
                                                <Label className="pl-1">Semester Name</Label>
                                                <Input value={semName} onChange={e => setSemName(e.target.value)} placeholder="Fall 2024" required className="h-12 rounded-xl bg-surface border-transparent" />
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label className="pl-1">Start Date</Label>
                                                    <Input type="date" value={semStart} onChange={e => setSemStart(e.target.value)} required className="h-12 rounded-xl bg-surface border-transparent" />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="pl-1">End Date</Label>
                                                    <Input type="date" value={semEnd} onChange={e => setSemEnd(e.target.value)} required className="h-12 rounded-xl bg-surface border-transparent" />
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3 p-4 bg-surface rounded-xl border border-transparent">
                                                <input type="checkbox" id="isCurrent" checked={semIsCurrent} onChange={e => setSemIsCurrent(e.target.checked)} className="w-5 h-5 accent-primary rounded" />
                                                <Label htmlFor="isCurrent" className="cursor-pointer text-base">Set as current semester</Label>
                                            </div>
                                            <DialogFooter>
                                                <Button type="submit" className="rounded-full h-11 px-8">Create Semester</Button>
                                            </DialogFooter>
                                        </form>
                                    </DialogContent>
                                </Dialog>
                            </CardHeader>
                            <CardContent className="p-8 pt-4">
                                <ScrollArea className="h-[400px] pr-4">
                                    {semesters.length > 0 ? (
                                        <div className="space-y-4">
                                            {semesters.map(sem => (
                                                <div key={sem.id} className="flex items-center justify-between p-5 rounded-[1.5rem] border border-transparent bg-surface hover:bg-surface-container-high hover:border-border/20 transition-all shadow-sm">
                                                    <div className="flex items-center gap-4">
                                                        {sem.isCurrent && (
                                                            <div className="h-10 w-1 bg-primary rounded-full"></div>
                                                        )}
                                                        <div>
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <p className="font-semibold text-lg text-on-surface">{sem.name}</p>
                                                                {sem.isCurrent && (
                                                                    <Badge variant="default" className="gap-1 rounded-md px-2 py-0.5 bg-primary/10 text-primary border-primary/20 shadow-none hover:bg-primary/20">
                                                                        <IconCheck className="w-3 h-3" /> Current
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                            <p className="text-sm text-on-surface-variant flex items-center gap-1.5">
                                                                <IconCalendar className="w-3.5 h-3.5 opacity-50" />
                                                                {sem.startDate} — {sem.endDate}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        {!sem.isCurrent && (
                                                            <Button variant="outline" size="sm" onClick={() => setCurrentSemester(sem.id)} className="rounded-full h-9 border-border/40 hover:bg-surface-container-high">
                                                                Set Current
                                                            </Button>
                                                        )}
                                                        <Button variant="ghost" size="icon" className="text-on-surface-variant hover:text-error hover:bg-error/10 rounded-full h-9 w-9" onClick={() => deleteSemester(sem.id)}>
                                                            <IconTrash className="w-4 h-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="py-20 text-center text-on-surface-variant/50 border-2 border-dashed border-border/20 rounded-[2rem] bg-surface/30">
                                            <IconCalendar className="w-12 h-12 mx-auto mb-4 opacity-30" />
                                            <p className="text-lg font-medium">No semesters yet</p>
                                            <p className="text-sm">Add your first semester to get started.</p>
                                        </div>
                                    )}
                                </ScrollArea>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* SUBJECTS TAB */}
                    <TabsContent value="subjects" className="mt-6">
                        <Card className="border-none shadow-sm rounded-[2.5rem] bg-surface-container overflow-hidden">
                            <CardHeader className="flex flex-row items-center justify-between p-8 pb-4">
                                <div>
                                    <CardTitle className="flex items-center gap-3 text-2xl font-normal text-on-surface">
                                        <div className="p-2.5 bg-secondary/10 rounded-xl text-secondary">
                                            <IconSchool className="w-6 h-6" />
                                        </div>
                                        Subjects
                                    </CardTitle>
                                    <CardDescription className="text-base text-on-surface-variant pl-14">
                                        {currentSemester ? `Subjects for ${currentSemester.name}` : "Select a current semester first"}
                                    </CardDescription>
                                </div>
                                <Dialog open={subDialogOpen} onOpenChange={setSubDialogOpen}>
                                    <DialogTrigger asChild>
                                        <Button disabled={!currentSemester} onClick={() => openSubjectDialog()} className="rounded-full h-11 px-6 shadow-md">
                                            <IconPlus className="w-5 h-5 mr-2" /> Add Subject
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent className="max-w-lg rounded-[2rem] border-none bg-surface-container p-0 overflow-hidden">
                                        <DialogHeader className="p-8 pb-4 bg-surface-container border-b border-border/10">
                                            <DialogTitle className="text-xl">{editingSubId ? "Edit Subject" : "Add Subject"}</DialogTitle>
                                            <DialogDescription>Enter subject details.</DialogDescription>
                                        </DialogHeader>
                                        <form onSubmit={handleSaveSubject} className="max-h-[70vh] overflow-y-auto px-8 py-6 space-y-6">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2 col-span-2">
                                                    <Label className="pl-1">Subject Name</Label>
                                                    <Input value={subName} onChange={e => setSubName(e.target.value)} placeholder="Operating Systems" required className="h-12 rounded-xl bg-surface border-transparent" />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="pl-1">Code</Label>
                                                    <Input value={subCode} onChange={e => setSubCode(e.target.value)} placeholder="CSE3003" required className="h-12 rounded-xl bg-surface border-transparent" />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="pl-1">Credits</Label>
                                                    <Input type="number" value={subCredits} onChange={e => setSubCredits(Number(e.target.value))} min={1} max={6} className="h-12 rounded-xl bg-surface border-transparent" />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="pl-1">Type</Label>
                                                    <Select value={subType} onValueChange={(value) => setSubType(value as typeof subType)}>
                                                        <SelectTrigger className="h-12 rounded-xl bg-surface border-transparent"><SelectValue /></SelectTrigger>
                                                        <SelectContent className="rounded-xl">
                                                            <SelectItem value="Theory">Theory</SelectItem>
                                                            <SelectItem value="Lab">Lab</SelectItem>
                                                            <SelectItem value="Embedded">Embedded (Theory + Lab)</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="pl-1">Slot</Label>
                                                    <Input value={subSlot} onChange={e => setSubSlot(e.target.value)} placeholder="A1+TA1" className="h-12 rounded-xl bg-surface border-transparent" />
                                                </div>
                                            </div>

                                            <div className="border-t border-border/10 pt-6">
                                                <h4 className="font-semibold mb-4 text-on-surface">Teacher Info</h4>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="space-y-2">
                                                        <Label className="pl-1">Teacher Name</Label>
                                                        <Input value={subTeacher} onChange={e => setSubTeacher(e.target.value)} placeholder="Dr. Example" className="h-12 rounded-xl bg-surface border-transparent" />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label className="pl-1">Teacher Email</Label>
                                                        <Input value={subTeacherEmail} onChange={e => setSubTeacherEmail(e.target.value)} placeholder="teacher@vit.ac.in" className="h-12 rounded-xl bg-surface border-transparent" />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label className="pl-1">Cabin No.</Label>
                                                        <Input value={subCabin} onChange={e => setSubCabin(e.target.value)} placeholder="TT-123" className="h-12 rounded-xl bg-surface border-transparent" />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label className="pl-1">Class Room</Label>
                                                        <Input value={subClassRoom} onChange={e => setSubClassRoom(e.target.value)} placeholder="AB1-501" className="h-12 rounded-xl bg-surface border-transparent" />
                                                    </div>
                                                    {(subType === "Lab" || subType === "Embedded") && (
                                                        <div className="space-y-2 col-span-2">
                                                            <Label className="pl-1">Lab Room</Label>
                                                            <Input value={subLabRoom} onChange={e => setSubLabRoom(e.target.value)} placeholder="SJT-G25" className="h-12 rounded-xl bg-surface border-transparent" />
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </form>
                                        <div className="p-6 pt-2 bg-surface-container border-t border-border/10">
                                            <Button onClick={handleSaveSubject} className="w-full rounded-full h-12 text-base font-medium">{editingSubId ? "Update Subject" : "Add Subject"}</Button>
                                        </div>
                                    </DialogContent>
                                </Dialog>
                            </CardHeader>
                            <CardContent className="p-8 pt-4">
                                <ScrollArea className="h-[500px] pr-4">
                                    {currentSemSubjects.length > 0 ? (
                                        <div className="grid md:grid-cols-2 gap-4">
                                            {currentSemSubjects.map(sub => (
                                                <div key={sub.id} className="p-5 rounded-[1.5rem] border border-transparent bg-surface hover:bg-surface-container-high hover:border-border/20 transition-all shadow-sm group">
                                                    <div className="flex items-start justify-between">
                                                        <div className="space-y-1">
                                                            <div className="flex items-center gap-2 mb-2 flex-wrap">
                                                                <p className="font-semibold text-lg text-on-surface">{sub.name}</p>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <Badge variant="outline" className="rounded-md border-border/40 text-on-surface-variant font-normal">{sub.code}</Badge>
                                                                <Badge variant="secondary" className="rounded-md bg-secondary/10 text-secondary hover:bg-secondary/20 font-normal">{sub.type}</Badge>
                                                                <span className="text-xs text-on-surface-variant/70">{sub.credits} Credits</span>
                                                            </div>
                                                            
                                                            <div className="pt-2 space-y-1">
                                                                {sub.slot && (
                                                                    <p className="text-sm text-on-surface-variant flex items-center gap-1.5">
                                                                        <IconClock className="w-3.5 h-3.5 opacity-50" /> Slot: {sub.slot}
                                                                    </p>
                                                                )}
                                                                {sub.teacherName && (
                                                                    <p className="text-sm text-on-surface-variant flex items-center gap-1.5">
                                                                        <IconUser className="w-3.5 h-3.5 opacity-50" /> {sub.teacherName}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div className="flex flex-col gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-surface-container" onClick={() => openSubjectDialog(sub)}>
                                                                <IconPencil className="w-4 h-4 text-on-surface-variant" />
                                                            </Button>
                                                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-error/10 hover:text-error" onClick={() => deleteSubject(sub.id)}>
                                                                <IconTrash className="w-4 h-4" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="py-24 text-center text-on-surface-variant/50 border-2 border-dashed border-border/20 rounded-[2rem] bg-surface/30">
                                            {currentSemester ? (
                                                <>
                                                    <IconSchool className="w-12 h-12 mx-auto mb-4 opacity-30" />
                                                    <p className="text-lg font-medium">No subjects yet</p>
                                                    <p className="text-sm">Add subjects for {currentSemester.name}</p>
                                                </>
                                            ) : (
                                                <>
                                                    <IconCalendar className="w-12 h-12 mx-auto mb-4 opacity-30" />
                                                    <p className="text-lg font-medium">No semester selected</p>
                                                    <p className="text-sm">Create and set a current semester first.</p>
                                                </>
                                            )}
                                        </div>
                                    )}
                                </ScrollArea>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </Shell>
    )
}
