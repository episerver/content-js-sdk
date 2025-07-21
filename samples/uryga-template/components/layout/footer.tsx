import { OptimizelyComponent } from '@episerver/cms-sdk/react/server'
import { GraphClient } from '@episerver/cms-sdk'

export async function Footer({ locale }: { locale: string }) {
  const client = new GraphClient(process.env.OPTIMIZELY_GRAPH_SINGLE_KEY!, {
    graphUrl: process.env.OPTIMIZELY_GRAPH_URL,
  })

  try {
    const c = await client.fetchContent(`/${locale}/footer/`)

    return <OptimizelyComponent opti={c} />
  } catch (error) {
    console.error('Error fetching content:', error)
    return null
  }
}
