import { useState } from 'react'
import { useProjects, useFeatures } from './hooks/useProjects'
import { useProjectWebSocket } from './hooks/useWebSocket'
import { ProjectSelector } from './components/ProjectSelector'
import { KanbanBoard } from './components/KanbanBoard'
import { AgentControl } from './components/AgentControl'
import { ProgressDashboard } from './components/ProgressDashboard'
import { SetupWizard } from './components/SetupWizard'
import { AddFeatureForm } from './components/AddFeatureForm'
import { FeatureModal } from './components/FeatureModal'
import { DebugLogViewer } from './components/DebugLogViewer'
import { Plus, Loader2 } from 'lucide-react'
import type { Feature } from './lib/types'

function App() {
  const [selectedProject, setSelectedProject] = useState<string | null>(null)
  const [showAddFeature, setShowAddFeature] = useState(false)
  const [selectedFeature, setSelectedFeature] = useState<Feature | null>(null)
  const [setupComplete, setSetupComplete] = useState(true) // Start optimistic
  const [debugOpen, setDebugOpen] = useState(false)

  const { data: projects, isLoading: projectsLoading } = useProjects()
  const { data: features } = useFeatures(selectedProject)
  const wsState = useProjectWebSocket(selectedProject)

  // Combine WebSocket progress with feature data
  const progress = wsState.progress.total > 0 ? wsState.progress : {
    passing: features?.done.length ?? 0,
    total: (features?.pending.length ?? 0) + (features?.in_progress.length ?? 0) + (features?.done.length ?? 0),
    percentage: 0,
  }

  if (progress.total > 0 && progress.percentage === 0) {
    progress.percentage = Math.round((progress.passing / progress.total) * 100 * 10) / 10
  }

  if (!setupComplete) {
    return <SetupWizard onComplete={() => setSetupComplete(true)} />
  }

  return (
    <div className="min-h-screen bg-[var(--color-neo-bg)]">
      {/* Header */}
      <header className="bg-[var(--color-neo-text)] text-white border-b-4 border-[var(--color-neo-border)]">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Logo and Title */}
            <h1 className="font-display text-2xl font-bold tracking-tight uppercase">
              Autonomous Coder
            </h1>

            {/* Controls */}
            <div className="flex items-center gap-4">
              <ProjectSelector
                projects={projects ?? []}
                selectedProject={selectedProject}
                onSelectProject={setSelectedProject}
                isLoading={projectsLoading}
              />

              {selectedProject && (
                <>
                  <button
                    onClick={() => setShowAddFeature(true)}
                    className="neo-btn neo-btn-primary text-sm"
                  >
                    <Plus size={18} />
                    Add Feature
                  </button>

                  <AgentControl
                    projectName={selectedProject}
                    status={wsState.agentStatus}
                  />
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className={`max-w-7xl mx-auto px-4 py-8 ${debugOpen ? 'pb-80' : ''}`}>
        {!selectedProject ? (
          <div className="neo-empty-state mt-12">
            <h2 className="font-display text-2xl font-bold mb-2">
              Welcome to Autonomous Coder
            </h2>
            <p className="text-[var(--color-neo-text-secondary)] mb-4">
              Select a project from the dropdown above or create a new one to get started.
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Progress Dashboard */}
            <ProgressDashboard
              passing={progress.passing}
              total={progress.total}
              percentage={progress.percentage}
              isConnected={wsState.isConnected}
            />

            {/* Initializing Features State - show when agent is running but no features yet */}
            {features &&
             features.pending.length === 0 &&
             features.in_progress.length === 0 &&
             features.done.length === 0 &&
             wsState.agentStatus === 'running' && (
              <div className="neo-card p-8 text-center">
                <Loader2 size={32} className="animate-spin mx-auto mb-4 text-[var(--color-neo-progress)]" />
                <h3 className="font-display font-bold text-xl mb-2">
                  Initializing Features...
                </h3>
                <p className="text-[var(--color-neo-text-secondary)]">
                  The agent is reading your spec and creating features. This may take a moment.
                </p>
              </div>
            )}

            {/* Kanban Board */}
            <KanbanBoard
              features={features}
              onFeatureClick={setSelectedFeature}
            />
          </div>
        )}
      </main>

      {/* Add Feature Modal */}
      {showAddFeature && selectedProject && (
        <AddFeatureForm
          projectName={selectedProject}
          onClose={() => setShowAddFeature(false)}
        />
      )}

      {/* Feature Detail Modal */}
      {selectedFeature && selectedProject && (
        <FeatureModal
          feature={selectedFeature}
          projectName={selectedProject}
          onClose={() => setSelectedFeature(null)}
        />
      )}

      {/* Debug Log Viewer - fixed to bottom */}
      {selectedProject && (
        <DebugLogViewer
          logs={wsState.logs}
          isOpen={debugOpen}
          onToggle={() => setDebugOpen(!debugOpen)}
          onClear={wsState.clearLogs}
        />
      )}
    </div>
  )
}

export default App
