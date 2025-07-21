import { BlankSectionContentType, Infer } from '@episerver/cms-sdk'
import {
  OptimizelyGridSection,
  StructureContainerProps,
  getPreviewUtils,
} from '@episerver/cms-sdk/react/server'

function Row({ children, node }: StructureContainerProps) {
  const { pa } = getPreviewUtils(node)
  return (
    <div
      className="vb:row flex flex-1 flex-col flex-nowrap md:flex-row"
      {...pa(node)}
    >
      {children}
    </div>
  )
}

function Column({ children, node }: StructureContainerProps) {
  const { pa } = getPreviewUtils(node)
  return (
    <div
      className="vb:col flex flex-1 flex-col flex-nowrap justify-start"
      {...pa(node)}
    >
      {children}
    </div>
  )
}

type BlankSectionProps = {
  opti: Infer<typeof BlankSectionContentType>
}

/** Defines a component to render a blank section */
export default function BlankSection({ opti }: BlankSectionProps) {
  const { pa } = getPreviewUtils(opti)
  return (
    <section
      className="vb:grid relative flex w-full flex-col flex-wrap"
      {...pa(opti)}
    >
      <OptimizelyGridSection nodes={opti.nodes} row={Row} column={Column} />
    </section>
  )
}
