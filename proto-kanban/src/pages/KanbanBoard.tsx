import { useMemo, useState } from 'react'
import { DndContext, useDroppable } from '@dnd-kit/core'
import type { DragEndEvent } from '@dnd-kit/core'
import { SortableContext, useSortable, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

type Ticket = {
  id: string
  name: string
  description: string
  estimate: number
  startDate: string
  endDate: string
  status: 'Backlog' | 'To Do' | 'In Progress' | 'Done'
}

type BoardData = {
  tickets: Ticket[]
}

const STATUSES: Ticket['status'][] = ['Backlog', 'To Do', 'In Progress', 'Done']

function TicketCard({ ticket }: { ticket: Ticket }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: ticket.id })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    background: 'white',
    border: '1px solid #ddd',
    padding: 8,
    borderRadius: 6,
    cursor: 'grab'
  } as const
  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <div style={{ fontWeight: 600 }}>{ticket.name} • {ticket.estimate}h</div>
      <div style={{ fontSize: 12, opacity: 0.8 }}>{ticket.description}</div>
      <div style={{ fontSize: 12, marginTop: 4 }}>Início: {ticket.startDate} • Fim: {ticket.endDate}</div>
    </div>
  )
}

export default function KanbanBoard() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [form, setForm] = useState<Omit<Ticket, 'id'>>({
    name: '', description: '', estimate: 1, startDate: '', endDate: '', status: 'Backlog'
  })

  const grouped = useMemo(() => {
    const group: Record<Ticket['status'], Ticket[]> = { Backlog: [], 'To Do': [], 'In Progress': [], Done: [] }
    for (const t of tickets) group[t.status].push(t)
    return group
  }, [tickets])

  const addTicket = () => {
    const id = String(Date.now())
    setTickets((prev) => prev.concat({ id, ...form }))
    setForm({ name: '', description: '', estimate: 1, startDate: '', endDate: '', status: 'Backlog' })
  }

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over) return
    const activeId = String(active.id)
    const overId = String(over.id)

    // If dropping onto a column header, change status; if within same column, reorder
    const isColumnTarget = STATUSES.includes(overId as Ticket['status'])
    setTickets((prev) => {
      const idx = prev.findIndex((t) => t.id === activeId)
      if (idx < 0) return prev
      const updated = [...prev]
      const ticket = { ...updated[idx] }
      if (isColumnTarget) {
        ticket.status = overId as Ticket['status']
        updated[idx] = ticket
        return updated
      }
      // Reorder within the same status list
      const overIdx = prev.findIndex((t) => t.id === overId)
      if (overIdx < 0) return prev
      if (prev[overIdx].status !== ticket.status) {
        ticket.status = prev[overIdx].status
        updated[idx] = ticket
      }
      const sameStatus = updated.filter((t) => t.status === ticket.status)
      const ids = sameStatus.map((t) => t.id)
      const from = ids.indexOf(activeId)
      const to = ids.indexOf(overId)
      const reorderedIds = arrayMove(ids, from, to)
      // rebuild order respecting other statuses
      const result: Ticket[] = []
      for (const s of STATUSES) {
        if (s === ticket.status) {
          const reordered = reorderedIds.map((id) => updated.find((t) => t.id === id)!)
          result.push(...reordered)
        } else {
          result.push(...updated.filter((t) => t.status === s))
        }
      }
      return result
    })
  }

  const handleSave = async () => {
    const api = window.electronAPI
    if (!api) return alert('API do Electron indisponível')
    const data: BoardData = { tickets }
    await api.saveJson({ data, defaultPath: 'kanban.json' })
  }

  const handleLoad = async () => {
    const api = window.electronAPI
    if (!api) return alert('API do Electron indisponível')
    const res = await api.openJson()
    if (!res.canceled && res.data && !res.error) {
      const loaded = res.data as BoardData
      setTickets(loaded.tickets || [])
    }
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 16 }}>
      <div>
        <h3>Novo Ticket</h3>
        <div style={{ display: 'grid', gap: 8 }}>
          <input placeholder="Nome" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <textarea placeholder="Descrição" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <input type="number" min={1} placeholder="Estimativa (h)" value={form.estimate} onChange={(e) => setForm({ ...form, estimate: Number(e.target.value) })} />
          <label>
            Início
            <input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
          </label>
          <label>
            Fim
            <input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
          </label>
          <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as Ticket['status'] })}>
            {STATUSES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <button onClick={addTicket}>Adicionar</button>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={handleSave}>Salvar Quadro</button>
            <button onClick={handleLoad}>Carregar Quadro</button>
          </div>
        </div>
      </div>
      <DndContext onDragEnd={onDragEnd}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          {STATUSES.map((status) => (
            <Column key={status} id={status} title={status} items={grouped[status].map((t) => t.id)}>
              <div style={{ display: 'grid', gap: 8 }}>
                {grouped[status].map((t) => (
                  <TicketCard key={t.id} ticket={t} />
                ))}
              </div>
            </Column>
          ))}
        </div>
      </DndContext>
    </div>
  )
}

function Column({ id, title, items, children }: { id: string; title: string; items: string[]; children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id })
  return (
    <div style={{ background: isOver ? '#eef6ff' : '#f7f7f7', padding: 8, borderRadius: 8, minHeight: 400 }}>
      <h4>{title}</h4>
      <SortableContext items={items} strategy={verticalListSortingStrategy}>
        <div ref={setNodeRef} style={{ minHeight: 360 }}>
          {children}
        </div>
      </SortableContext>
    </div>
  )
}

