import { useCallback, useMemo, useRef, useState } from 'react'
import ReactFlow, {
  Background,
  Controls,
  addEdge,
  MiniMap,
  useEdgesState,
  useNodesState
} from 'reactflow'
import type { Connection, Edge, Node } from 'reactflow'
import 'reactflow/dist/style.css'

type FlowData = {
  nodes: Node[]
  edges: Edge[]
}

const initialNodes: Node[] = [
  { id: '1', position: { x: 100, y: 100 }, data: { label: 'Tela 1' }, type: 'input' }
]
const initialEdges: Edge[] = []

export default function PrototypeEditor() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)
  const idRef = useRef(2)
  const [filePath, setFilePath] = useState<string | undefined>(undefined)

  const onConnect = useCallback((connection: Connection) => {
    setEdges((eds) => addEdge(connection, eds))
  }, [setEdges])

  const addNode = useCallback(() => {
    const id = String(idRef.current++)
    const newNode: Node = {
      id,
      position: { x: Math.random() * 400 + 50, y: Math.random() * 300 + 50 },
      data: { label: `Tela ${id}` }
    }
    setNodes((nds) => nds.concat(newNode))
  }, [setNodes])

  const data: FlowData = useMemo(() => ({ nodes, edges }), [nodes, edges])

  const handleSave = async () => {
    const api = window.electronAPI
    if (!api) return alert('API do Electron indisponível')
    const res = await api.saveJson({ data, defaultPath: filePath || 'fluxo.json' })
    if (!res.canceled && res.filePath) setFilePath(res.filePath)
  }

  const handleLoad = async () => {
    const api = window.electronAPI
    if (!api) return alert('API do Electron indisponível')
    const res = await api.openJson()
    if (!res.canceled && res.data && !res.error) {
      const loaded = res.data as FlowData
      setNodes(loaded.nodes || [])
      setEdges(loaded.edges || [])
      setFilePath(res.filePath)
    } else if (res.error) {
      alert(res.error)
    }
  }

  return (
    <div style={{ width: '100%', height: 'calc(100vh - 90px)' }}>
      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
        <button onClick={addNode}>Adicionar Tela</button>
        <button onClick={handleSave}>Salvar Fluxo</button>
        <button onClick={handleLoad}>Carregar Fluxo</button>
        {filePath ? <span style={{ marginLeft: 8, opacity: 0.7 }}>Arquivo: {filePath}</span> : null}
      </div>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        fitView
      >
        <MiniMap />
        <Controls />
        <Background />
      </ReactFlow>
    </div>
  )
}

