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
    IconEyeOff
} from "@tabler/icons-react"
import { useStore } from "@/components/providers/store-provider"
import { toast } from "sonner"
import { signOut } from "next-auth/react"
import { IconLogout } from "@tabler/icons-react"

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

    // Load settings
    React.useEffect(() => {
        if (settings) {
            setDisplayName(settings.displayName || "")
            setEmail(settings.email || "")
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
            <div className="max-w-4xl mx-auto flex flex-col gap-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
                    <p className="text-muted-foreground">Manage your profile, semesters, and subjects.</p>
                </div>

                <Tabs defaultValue="profile" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="profile">Profile</TabsTrigger>
                        <TabsTrigger value="semesters">Semesters</TabsTrigger>
                        <TabsTrigger value="subjects">Subjects</TabsTrigger>
                    </TabsList>

                    {/* PROFILE TAB */}
                    <TabsContent value="profile">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <IconUser className="w-5 h-5" /> Profile Settings
                                </CardTitle>
                                <CardDescription>Update your personal information and preferences.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="name">Display Name</Label>
                                        <Input id="name" value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="Your Name" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="email">Email</Label>
                                        <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@university.edu" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="dept">Department</Label>
                                        <Input id="dept" value={department} onChange={e => setDepartment(e.target.value)} placeholder="CSE" />
                                    </div>
                                </div>

                                <div className="border-t pt-6">
                                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                                        <IconClock className="w-4 h-4" /> Pomodoro Settings
                                    </h3>
                                    <div className="grid gap-4 md:grid-cols-2">
                                        <div className="space-y-2">
                                            <Label htmlFor="focus">Focus Duration (minutes)</Label>
                                            <Input id="focus" type="number" value={focusDuration} onChange={e => setFocusDuration(Number(e.target.value))} min={1} max={120} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="break">Break Duration (minutes)</Label>
                                            <Input id="break" type="number" value={breakDuration} onChange={e => setBreakDuration(Number(e.target.value))} min={1} max={60} />
                                        </div>
                                    </div>
                                </div>

                                {/* Notification Settings */}
                                <div className="border-t pt-6">
                                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                                        <IconDeviceFloppy className="w-4 h-4" /> Email Notifications
                                    </h3>
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                id="notify"
                                                checked={emailNotifications}
                                                onChange={e => setEmailNotifications(e.target.checked)}
                                                className="w-4 h-4"
                                            />
                                            <Label htmlFor="notify">Enable daily email reminders (Due Today/Tomorrow)</Label>
                                        </div>
                                        {emailNotifications && (
                                            <div className="space-y-4 shadow-sm border p-4 rounded-md">
                                                <div className="space-y-2">
                                                    <Label htmlFor="notifyEmail">Notification Email</Label>
                                                    <div className="flex gap-2">
                                                        <Input
                                                            id="notifyEmail"
                                                            type="email"
                                                            value={notificationEmail}
                                                            onChange={e => setNotificationEmail(e.target.value)}
                                                            placeholder="Enter email for alerts..."
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
                                                        >
                                                            Test
                                                        </Button>
                                                    </div>
                                                    <p className="text-xs text-muted-foreground">
                                                        We'll send reminders here. Make sure it's valid!
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* API Settings */}
                                <div className="border-t pt-6">
                                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                                        <IconSparkles className="w-4 h-4" /> API Integrations
                                    </h3>
                                    <div className="space-y-4">
                                        {/* GROQ Key */}
                                        <div className="space-y-2">
                                            <Label htmlFor="apiKey">GROQ API Key</Label>
                                            <div className="flex gap-2">
                                                <div className="relative flex-1">
                                                    <Input
                                                        id="apiKey"
                                                        type={showApiKey ? "text" : "password"}
                                                        value={groqApiKey}
                                                        onChange={e => setGroqApiKey(e.target.value)}
                                                        placeholder="gsk_..."
                                                        className="pr-10"
                                                    />
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                                                        onClick={() => setShowApiKey(!showApiKey)}
                                                    >
                                                        {showApiKey ? <IconEyeOff className="w-4 h-4" /> : <IconEye className="w-4 h-4" />}
                                                    </Button>
                                                </div>
                                            </div>
                                            <p className="text-xs text-muted-foreground">
                                                Required for AI recommendations. Get it at <a href="https://console.groq.com" target="_blank" rel="noopener noreferrer" className="underline">console.groq.com</a>
                                            </p>
                                        </div>

                                        {/* Resend Key */}
                                        <div className="space-y-2">
                                            <Label htmlFor="resendKey">Resend API Key</Label>
                                            <div className="flex gap-2">
                                                <div className="relative flex-1">
                                                    <Input
                                                        id="resendKey"
                                                        type="password"
                                                        value={resendApiKey}
                                                        onChange={e => setResendApiKey(e.target.value)}
                                                        placeholder="re_..."
                                                    />
                                                </div>
                                            </div>
                                            <p className="text-xs text-muted-foreground">
                                                Required for email notifications. Get it at <a href="https://resend.com/api-keys" target="_blank" rel="noopener noreferrer" className="underline">resend.com</a>
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex justify-between items-center border-t pt-6">
                                    <Button onClick={handleSaveProfile} className="gap-2">
                                        <IconDeviceFloppy className="w-4 h-4" /> Save Changes
                                    </Button>

                                    <Button
                                        variant="outline"
                                        onClick={() => signOut({ callbackUrl: '/auth/signin' })}
                                        className="gap-2 text-muted-foreground hover:text-foreground"
                                    >
                                        <IconLogout className="w-4 h-4" /> Sign Out
                                    </Button>
                                </div>

                                {/* Danger Zone */}
                                <div className="border-t pt-6 mt-6">
                                    <h3 className="font-semibold text-destructive mb-2 flex items-center gap-2">
                                        <IconTrash className="w-4 h-4" /> Danger Zone
                                    </h3>
                                    <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4 flex items-center justify-between">
                                        <div>
                                            <p className="font-medium text-destructive">Delete Account</p>
                                            <p className="text-sm text-muted-foreground">
                                                Permanently delete your account and all data. This action cannot be undone.
                                            </p>
                                        </div>
                                        <Dialog>
                                            <DialogTrigger asChild>
                                                <Button variant="destructive">Delete Account</Button>
                                            </DialogTrigger>
                                            <DialogContent>
                                                <DialogHeader>
                                                    <DialogTitle>Are you absolutely sure?</DialogTitle>
                                                    <DialogDescription>
                                                        This action cannot be undone. This will permanently delete your account and remove your data from our servers.
                                                    </DialogDescription>
                                                </DialogHeader>
                                                <DialogFooter>
                                                    <Button variant="outline" onClick={() => { }}>Cancel</Button>
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
                    <TabsContent value="semesters">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <div>
                                    <CardTitle className="flex items-center gap-2">
                                        <IconCalendar className="w-5 h-5" /> Semesters
                                    </CardTitle>
                                    <CardDescription>Manage your academic semesters.</CardDescription>
                                </div>
                                <Dialog open={semDialogOpen} onOpenChange={setSemDialogOpen}>
                                    <DialogTrigger asChild>
                                        <Button size="sm"><IconPlus className="w-4 h-4 mr-1" /> Add Semester</Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                        <DialogHeader>
                                            <DialogTitle>Add Semester</DialogTitle>
                                            <DialogDescription>Create a new academic semester.</DialogDescription>
                                        </DialogHeader>
                                        <form onSubmit={handleAddSemester} className="space-y-4">
                                            <div className="space-y-2">
                                                <Label>Semester Name</Label>
                                                <Input value={semName} onChange={e => setSemName(e.target.value)} placeholder="Fall 2024" required />
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label>Start Date</Label>
                                                    <Input type="date" value={semStart} onChange={e => setSemStart(e.target.value)} required />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>End Date</Label>
                                                    <Input type="date" value={semEnd} onChange={e => setSemEnd(e.target.value)} required />
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <input type="checkbox" id="isCurrent" checked={semIsCurrent} onChange={e => setSemIsCurrent(e.target.checked)} />
                                                <Label htmlFor="isCurrent">Set as current semester</Label>
                                            </div>
                                            <DialogFooter>
                                                <Button type="submit">Create Semester</Button>
                                            </DialogFooter>
                                        </form>
                                    </DialogContent>
                                </Dialog>
                            </CardHeader>
                            <CardContent>
                                <ScrollArea className="h-[300px]">
                                    {semesters.length > 0 ? (
                                        <div className="space-y-3">
                                            {semesters.map(sem => (
                                                <div key={sem.id} className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
                                                    <div className="flex items-center gap-3">
                                                        {sem.isCurrent && (
                                                            <Badge variant="default" className="gap-1">
                                                                <IconCheck className="w-3 h-3" /> Current
                                                            </Badge>
                                                        )}
                                                        <div>
                                                            <p className="font-medium">{sem.name}</p>
                                                            <p className="text-xs text-muted-foreground">{sem.startDate} — {sem.endDate}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        {!sem.isCurrent && (
                                                            <Button variant="outline" size="sm" onClick={() => setCurrentSemester(sem.id)}>
                                                                Set Current
                                                            </Button>
                                                        )}
                                                        <Button variant="ghost" size="icon" className="text-destructive" onClick={() => deleteSemester(sem.id)}>
                                                            <IconTrash className="w-4 h-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="py-12 text-center text-muted-foreground">
                                            <p>No semesters yet. Add your first semester to get started.</p>
                                        </div>
                                    )}
                                </ScrollArea>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* SUBJECTS TAB */}
                    <TabsContent value="subjects">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <div>
                                    <CardTitle className="flex items-center gap-2">
                                        <IconSchool className="w-5 h-5" /> Subjects
                                    </CardTitle>
                                    <CardDescription>
                                        {currentSemester ? `Subjects for ${currentSemester.name}` : "Select a current semester first"}
                                    </CardDescription>
                                </div>
                                <Dialog open={subDialogOpen} onOpenChange={setSubDialogOpen}>
                                    <DialogTrigger asChild>
                                        <Button size="sm" disabled={!currentSemester} onClick={() => openSubjectDialog()}>
                                            <IconPlus className="w-4 h-4 mr-1" /> Add Subject
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent className="max-w-lg">
                                        <DialogHeader>
                                            <DialogTitle>{editingSubId ? "Edit Subject" : "Add Subject"}</DialogTitle>
                                            <DialogDescription>Enter subject details.</DialogDescription>
                                        </DialogHeader>
                                        <form onSubmit={handleSaveSubject} className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2 col-span-2">
                                                    <Label>Subject Name</Label>
                                                    <Input value={subName} onChange={e => setSubName(e.target.value)} placeholder="Operating Systems" required />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>Code</Label>
                                                    <Input value={subCode} onChange={e => setSubCode(e.target.value)} placeholder="CSE3003" required />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>Credits</Label>
                                                    <Input type="number" value={subCredits} onChange={e => setSubCredits(Number(e.target.value))} min={1} max={6} />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>Type</Label>
                                                    <Select value={subType} onValueChange={(v: any) => setSubType(v)}>
                                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="Theory">Theory</SelectItem>
                                                            <SelectItem value="Lab">Lab</SelectItem>
                                                            <SelectItem value="Embedded">Embedded (Theory + Lab)</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>Slot</Label>
                                                    <Input value={subSlot} onChange={e => setSubSlot(e.target.value)} placeholder="A1+TA1" />
                                                </div>
                                            </div>

                                            <div className="border-t pt-4">
                                                <h4 className="font-semibold mb-3">Teacher Info</h4>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="space-y-2">
                                                        <Label>Teacher Name</Label>
                                                        <Input value={subTeacher} onChange={e => setSubTeacher(e.target.value)} placeholder="Dr. Example" />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label>Teacher Email</Label>
                                                        <Input value={subTeacherEmail} onChange={e => setSubTeacherEmail(e.target.value)} placeholder="teacher@vit.ac.in" />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label>Cabin No.</Label>
                                                        <Input value={subCabin} onChange={e => setSubCabin(e.target.value)} placeholder="TT-123" />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label>Class Room</Label>
                                                        <Input value={subClassRoom} onChange={e => setSubClassRoom(e.target.value)} placeholder="AB1-501" />
                                                    </div>
                                                    {(subType === "Lab" || subType === "Embedded") && (
                                                        <div className="space-y-2 col-span-2">
                                                            <Label>Lab Room</Label>
                                                            <Input value={subLabRoom} onChange={e => setSubLabRoom(e.target.value)} placeholder="SJT-G25" />
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            <DialogFooter>
                                                <Button type="submit">{editingSubId ? "Update Subject" : "Add Subject"}</Button>
                                            </DialogFooter>
                                        </form>
                                    </DialogContent>
                                </Dialog>
                            </CardHeader>
                            <CardContent>
                                <ScrollArea className="h-[400px]">
                                    {currentSemSubjects.length > 0 ? (
                                        <div className="space-y-3">
                                            {currentSemSubjects.map(sub => (
                                                <div key={sub.id} className="p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
                                                    <div className="flex items-start justify-between">
                                                        <div>
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <p className="font-semibold">{sub.name}</p>
                                                                <Badge variant="outline">{sub.code}</Badge>
                                                                <Badge variant="secondary">{sub.type}</Badge>
                                                            </div>
                                                            <p className="text-sm text-muted-foreground">
                                                                {sub.credits} Credits {sub.slot && `· Slot: ${sub.slot}`}
                                                            </p>
                                                            {sub.teacherName && (
                                                                <p className="text-sm text-muted-foreground mt-1">
                                                                    👨‍🏫 {sub.teacherName} {sub.cabinNo && `· Cabin: ${sub.cabinNo}`}
                                                                </p>
                                                            )}
                                                        </div>
                                                        <div className="flex gap-1">
                                                            <Button variant="ghost" size="icon" onClick={() => openSubjectDialog(sub)}>
                                                                <IconPencil className="w-4 h-4" />
                                                            </Button>
                                                            <Button variant="ghost" size="icon" className="text-destructive" onClick={() => deleteSubject(sub.id)}>
                                                                <IconTrash className="w-4 h-4" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="py-12 text-center text-muted-foreground">
                                            {currentSemester
                                                ? <p>No subjects for this semester yet.</p>
                                                : <p>Create and set a current semester first.</p>
                                            }
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
