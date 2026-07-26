'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
    FileText,
    Workflow,
    Users,
    Target as TargetIcon,
    Boxes,
    Files,
    Lightbulb,
    CheckCircle2,
    ArrowRight,
    ArrowLeft,
    X,
    Trash2,
} from 'lucide-react'
import StepProgressBar from '@/components/workforce/StepProgressBar'
import {
    addDocument,
    documentsByCategory,
    getDocuments,
    removeDocument,
    setCurrentStep,
    CATEGORY_LABELS,
    type DocumentCategory,
    type OperationalDocument,
} from '@/lib/workforceState'
import { SAMPLE_DOC_NAMES } from '@/lib/workforceMock'
import { workforceAPI } from '@/lib/api'
import { MOCK_ONLY } from '@/lib/mockConfig'
import toast from 'react-hot-toast'

type Tile = {
    category: DocumentCategory
    label: string
    icon: any
    description: string
    accent: string
    fileTypes: string
}

const TILES: Tile[] = [
    {
        category: 'sop',
        label: 'SOPs & Policies',
        icon: FileText,
        description: 'Standard operating procedures, policies, and internal guidance.',
        accent: 'violet',
        fileTypes: 'PDF, DOCX, TXT (Max 25MB)',
    },
    {
        category: 'workflow',
        label: 'Workflows & Processes',
        icon: Workflow,
        description: 'Process maps, workflow diagrams, or operational procedures.',
        accent: 'emerald',
        fileTypes: 'PDF, DOCX, PNG, TXT (Max 25MB)',
    },
    {
        category: 'role',
        label: 'Role Descriptions',
        icon: Users,
        description: 'Job descriptions, role expectations, and key responsibilities.',
        accent: 'sky',
        fileTypes: 'PDF, DOCX, TXT (Max 25MB)',
    },
    {
        category: 'mission',
        label: 'Mission & Objectives',
        icon: TargetIcon,
        description: 'Mission statements, strategic goals, or program objectives.',
        accent: 'amber',
        fileTypes: 'PDF, DOCX, TXT (Max 25MB)',
    },
    {
        category: 'skill_framework',
        label: 'Skill Frameworks',
        icon: Boxes,
        description: 'Competency models, skill frameworks, or capability models.',
        accent: 'rose',
        fileTypes: 'PDF, DOCX, TXT (Max 25MB)',
    },
    {
        category: 'other',
        label: 'Other Supporting Docs',
        icon: Files,
        description: 'Any other documents that help us understand your operational environment.',
        accent: 'slate',
        fileTypes: 'PDF, DOCX, TXT (Max 25MB)',
    },
]

const ACCENT_CLASSES: Record<string, { bg: string; text: string; border: string; tile: string }> = {
    violet: { bg: 'bg-violet-50', text: 'text-violet-600', border: 'border-violet-100', tile: 'hover:border-violet-300' },
    emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-100', tile: 'hover:border-emerald-300' },
    sky: { bg: 'bg-sky-50', text: 'text-sky-600', border: 'border-sky-100', tile: 'hover:border-sky-300' },
    amber: { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-100', tile: 'hover:border-amber-300' },
    rose: { bg: 'bg-rose-50', text: 'text-rose-600', border: 'border-rose-100', tile: 'hover:border-rose-300' },
    slate: { bg: 'bg-slate-50', text: 'text-slate-600', border: 'border-slate-100', tile: 'hover:border-slate-300' },
}

export default function OperationalContextPage() {
    const router = useRouter()
    const [docs, setDocs] = useState<OperationalDocument[]>([])
    const [uploading, setUploading] = useState<DocumentCategory | null>(null)
    const inputRefs = useRef<Record<DocumentCategory, HTMLInputElement | null>>({
        sop: null, workflow: null, role: null, mission: null, skill_framework: null, other: null,
    })

    const refreshDocs = async () => {
        if (MOCK_ONLY) {
            setDocs(getDocuments())
            return
        }
        const remote = await workforceAPI.listContextDocuments()
        setDocs(
            remote.map((d: any) => ({
                id: String(d.id),
                name: d.name,
                category: d.category as DocumentCategory,
                size_kb: d.size_kb,
                uploaded_at: d.uploaded_at,
            }))
        )
    }

    useEffect(() => {
        setCurrentStep(2)
        refreshDocs()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const handleFiles = async (category: DocumentCategory, fileList: FileList | null) => {
        if (!fileList || fileList.length === 0) return

        if (MOCK_ONLY) {
            let added = 0
            for (let i = 0; i < fileList.length; i++) {
                const file = fileList[i]
                const newDoc: OperationalDocument = {
                    id: `${Date.now()}-${i}-${Math.random().toString(36).slice(2, 8)}`,
                    name: file.name,
                    category,
                    size_kb: Math.max(1, Math.round(file.size / 1024)),
                    uploaded_at: new Date().toISOString(),
                }
                addDocument(newDoc)
                added++
            }
            setDocs(getDocuments())
            toast.success(`${added} document${added === 1 ? '' : 's'} added to ${CATEGORY_LABELS[category]}`)
            return
        }

        setUploading(category)
        let added = 0
        try {
            for (let i = 0; i < fileList.length; i++) {
                await workforceAPI.uploadContextDocument(fileList[i], category)
                added++
            }
            await refreshDocs()
            toast.success(`${added} document${added === 1 ? '' : 's'} added to ${CATEGORY_LABELS[category]}`)
        } catch (err: any) {
            if (err?.response?.data?.detail === 'INSUFFICIENT_CREDITS') {
                toast.error('Not enough credits to analyze this document.')
            } else {
                toast.error('Could not upload document. Please try again.')
            }
        } finally {
            setUploading(null)
        }
    }

    const handleQuickAdd = (category: DocumentCategory) => {
        // Demo-only helper — adds a realistic-looking sample doc with one click.
        // Not available against the real backend since there's no file to analyze.
        const samples = SAMPLE_DOC_NAMES[category]
        const existing = docs.filter((d) => d.category === category).map((d) => d.name)
        const pick = samples.find((s) => !existing.includes(s)) || samples[0]
        const newDoc: OperationalDocument = {
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            name: pick,
            category,
            size_kb: Math.floor(120 + Math.random() * 480),
            uploaded_at: new Date().toISOString(),
        }
        addDocument(newDoc)
        setDocs(getDocuments())
        toast.success(`Added sample: ${pick}`)
    }

    const handleRemove = async (id: string) => {
        if (MOCK_ONLY) {
            removeDocument(id)
            setDocs(getDocuments())
            return
        }
        try {
            await workforceAPI.deleteContextDocument(Number(id))
            await refreshDocs()
        } catch {
            toast.error('Could not remove document.')
        }
    }

    const handleContinue = () => {
        setCurrentStep(3)
        router.push('/workforce/analysis-comparison')
    }

    const groupedDocs = documentsByCategory()
    const totalDocs = docs.length

    return (
        <div className="max-w-7xl mx-auto pb-10">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                    Step 2 of 5: Add Operational Context
                </h1>
                <p className="text-slate-500 font-medium mt-1">
                    Upload documents that describe the work, processes, and requirements in your organization.
                </p>
            </div>

            {/* Step progress */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 mb-6">
                <StepProgressBar currentStep={2} maxReachable={2} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[1fr,280px] gap-6">
                {/* Main column */}
                <div className="space-y-6">
                    {/* Tiles */}
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                        <h2 className="font-black text-slate-900 mb-1">Upload Your Documents</h2>
                        <p className="text-xs text-slate-500 mb-5">
                            Add files that provide operational context for accurate analysis and personalized recommendations.
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {TILES.map((tile) => {
                                const acc = ACCENT_CLASSES[tile.accent]
                                const count = groupedDocs[tile.category].length
                                const Icon = tile.icon
                                return (
                                    <div
                                        key={tile.category}
                                        className={`relative rounded-2xl border-2 ${acc.border} bg-white p-5 transition-all ${acc.tile} hover:shadow-md group`}
                                    >
                                        {count > 0 && (
                                            <span className="absolute top-3 right-3 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-black border border-emerald-200">
                                                <CheckCircle2 className="w-3 h-3" />
                                                {count}
                                            </span>
                                        )}
                                        <div className={`w-11 h-11 rounded-xl ${acc.bg} ${acc.text} flex items-center justify-center mb-3`}>
                                            <Icon className="w-5 h-5" />
                                        </div>
                                        <h3 className="font-black text-slate-900 text-sm mb-1">{tile.label}</h3>
                                        <p className="text-[11px] text-slate-500 leading-snug mb-4 min-h-[2.5rem]">{tile.description}</p>

                                        <input
                                            ref={(el) => { inputRefs.current[tile.category] = el }}
                                            type="file"
                                            multiple
                                            className="hidden"
                                            accept=".pdf,.doc,.docx,.txt,.png,.jpg"
                                            onChange={(e) => {
                                                handleFiles(tile.category, e.target.files)
                                                e.target.value = ''
                                            }}
                                        />
                                        <div className="flex gap-2">
                                            <button
                                                type="button"
                                                onClick={() => inputRefs.current[tile.category]?.click()}
                                                disabled={uploading === tile.category}
                                                className={`flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg ${acc.bg} ${acc.text} text-[11px] font-black uppercase tracking-widest hover:brightness-95 transition disabled:opacity-60`}
                                            >
                                                {uploading === tile.category ? 'Analyzing…' : 'Upload Files'}
                                            </button>
                                            {MOCK_ONLY && (
                                                <button
                                                    type="button"
                                                    onClick={() => handleQuickAdd(tile.category)}
                                                    title="Use a sample document for this category"
                                                    className="px-2.5 rounded-lg bg-slate-50 text-slate-500 hover:bg-slate-100 text-[10px] font-bold transition"
                                                >
                                                    +Sample
                                                </button>
                                            )}
                                        </div>

                                        <p className="text-[10px] text-slate-400 mt-2">{tile.fileTypes}</p>
                                    </div>
                                )
                            })}
                        </div>
                    </div>

                    {/* Uploaded list */}
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-black text-slate-900">Uploaded Documents <span className="text-slate-400 font-medium">({totalDocs})</span></h3>
                            {totalDocs > 0 && (
                                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Ready for analysis</span>
                            )}
                        </div>
                        {totalDocs === 0 ? (
                            <div className="p-8 rounded-xl bg-slate-50/50 border border-dashed border-slate-200 text-center">
                                <p className="text-sm text-slate-400 font-medium">Your uploaded files will appear here.</p>
                                {MOCK_ONLY && (
                                    <p className="text-[11px] text-slate-400 mt-1">You can also click "+Sample" on any tile to use a starter document.</p>
                                )}
                            </div>
                        ) : (
                            <ul className="divide-y divide-slate-100">
                                {docs.map((d) => (
                                    <li key={d.id} className="flex items-center gap-3 py-2.5">
                                        <div className="w-9 h-9 rounded-lg bg-violet-50 text-violet-600 flex items-center justify-center shrink-0">
                                            <FileText className="w-4 h-4" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-bold text-slate-900 truncate">{d.name}</p>
                                            <p className="text-[10px] text-slate-500">{CATEGORY_LABELS[d.category]} · {d.size_kb} KB</p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => handleRemove(d.id)}
                                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                                            aria-label="Remove"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>

                {/* Right rail */}
                <div className="space-y-4">
                    <div className="rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 p-5">
                        <div className="flex items-start gap-3">
                            <Lightbulb className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                            <div>
                                <p className="text-sm font-black text-slate-900 mb-1">Why Operational Context?</p>
                                <p className="text-xs text-slate-700 leading-relaxed">
                                    Uploading SOPs, workflows, and role information helps our AI understand the real work, required capabilities, and mission needs — so we can identify gaps and recommend the right path.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-5">
                        <p className="text-[10px] font-black uppercase tracking-widest text-emerald-700 mb-2">What You'll Get</p>
                        <ul className="space-y-2 text-xs text-emerald-900 font-medium">
                            {[
                                'Operational readiness assessment',
                                'Capability gap analysis',
                                'Role alignment insights',
                                'Personalized development pathway',
                                'Mission & strategic alignment',
                            ].map((x) => (
                                <li key={x} className="flex items-start gap-2">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                                    {x}
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="rounded-2xl bg-violet-50 border border-violet-200 p-5">
                        <p className="text-[10px] font-black uppercase tracking-widest text-violet-700 mb-2">Pro Tip</p>
                        <p className="text-xs text-violet-900 leading-relaxed">
                            The more operational context you provide, the more accurate and relevant your results will be.
                        </p>
                    </div>

                    <div className="rounded-2xl bg-white border border-slate-100 shadow-sm p-5">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Examples</p>
                        <ul className="space-y-1.5 text-xs text-slate-700 font-medium">
                            <li>· IT incident management SOP</li>
                            <li>· Onboarding workflow</li>
                            <li>· Help desk escalation process</li>
                            <li>· Role description for Cybersecurity Analyst</li>
                        </ul>
                        {MOCK_ONLY && (
                            <button
                                type="button"
                                onClick={() => {
                                    handleQuickAdd('sop')
                                    handleQuickAdd('workflow')
                                    handleQuickAdd('role')
                                }}
                                className="text-[11px] font-black text-violet-600 hover:text-violet-700 mt-3 inline-flex items-center gap-1"
                            >
                                Load sample documents →
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Action row */}
            <div className="flex items-center justify-between mt-6 pt-6 border-t border-slate-200 flex-wrap gap-3">
                <Link
                    href="/workforce/profile"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-sm transition"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back
                </Link>
                <div className="flex items-center gap-3">
                    <Link href="/dashboard" className="px-5 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 font-bold text-sm transition">
                        Save &amp; Exit
                    </Link>
                    <button
                        type="button"
                        onClick={handleContinue}
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold text-sm shadow-lg shadow-violet-200 hover:scale-[1.02] transition"
                    >
                        Continue
                        <ArrowRight className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    )
}
