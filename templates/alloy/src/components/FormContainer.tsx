import { OptiFormsContainerContentType } from '@optimizely/cms-sdk';
import { getPreviewUtils, OptimizelyGridSection } from '@optimizely/cms-sdk/react/server';
import {
  FormStatusProvider,
  FormStep,
  FormWrapper,
} from '@optimizely/cms-sdk/forms/react';
import FormTitle from './FormTitle';
import FormDescription from './FormDescription';
import FormAlerts from './FormAlerts';
import FormStepTracker from './FormStepTracker';
import GridRow from './GridRow';
import GridColumn from './GridColumn';

type FormContainerProps = {
  content: OptiFormsContainerContentType;
};

type Node = NonNullable<OptiFormsContainerContentType['nodes']>[number];

/**
 * A node's own `__typename` is always `CompositionStructureNode` or
 * `CompositionComponentNode`, so the content type has to be read off the
 * component it wraps.
 */
const isSubmitNode = (node: Node) =>
  node.nodeType === 'component' &&
  (node.component as { __typename?: string } | undefined)?.__typename ===
    'OptiFormsSubmitElement';

/**
 * Pulls the buttons out of a step's rows and columns so they can be laid out as
 * one footer.
 *
 * Editors place Previous, Next and Submit wherever they like — typically each in
 * its own row, which stacks them and stretches them to the column width. Lifting
 * them out gives the usual "back on the left, forward on the right" footer no
 * matter how the step was authored. Rows left empty afterwards are dropped.
 */
function splitOutButtons(nodes: Node[]): { content: Node[]; buttons: Node[] } {
  const content: Node[] = [];
  const buttons: Node[] = [];

  for (const node of nodes) {
    const childNodes = 'nodes' in node ? node.nodes : undefined;

    if (isSubmitNode(node)) {
      buttons.push(node);
    } else if (Array.isArray(childNodes)) {
      const inner = splitOutButtons(childNodes);
      buttons.push(...inner.buttons);
      if (inner.content.length > 0) content.push({ ...node, nodes: inner.content });
    } else {
      content.push(node);
    }
  }

  return { content, buttons };
}

/** Footer holding a step's buttons: back on the left, forward on the right. */
function FormActions({ nodes }: { nodes: Node[] }) {
  return (
    <div className='mt-6 flex flex-wrap items-center gap-3 border-t border-gray-200 pt-5'>
      <OptimizelyGridSection nodes={nodes} row={GridRow} column={GridColumn} />
    </div>
  );
}

export default function FormContainer({ content }: FormContainerProps) {
  const { pa } = getPreviewUtils(content);
  const nodes = (content.nodes ?? []) as Node[];
  const buttonNodes = nodes.filter(isSubmitNode);
  const stepNodes = nodes.filter(node => !isSubmitNode(node));

  return (
    <FormStatusProvider>
      {/* Forms read better narrow. Long lines make a field look like a text block. */}
      <div id='form-alert' className='max-w-2xl space-y-5'>
        <div className='space-y-2'>
          <FormTitle title={content.Title ?? null} previewAttributes={pa} />
          <FormDescription
            description={content.Description ?? null}
            previewAttributes={pa}
          />
        </div>

        <FormAlerts
          submitConfirmationMessage={content.SubmitConfirmationMessage ?? null}
        />

        <FormWrapper
          scrollToOnSuccess='form-alert'
          scrollToOnError={false}
          action={content.SubmitUrl?.default ?? ''}
          steps={stepNodes}
          rules={content.DependencyRules}
        >
          <div className='space-y-6 rounded-lg border border-gray-200 bg-white p-6 sm:p-8'>
            <FormStepTracker steps={stepNodes.length} />

            {stepNodes.map((node, index) => {
              const step = splitOutButtons([node]);

              return (
                <FormStep key={node.key} index={index}>
                  <OptimizelyGridSection
                    nodes={step.content}
                    row={GridRow}
                    column={GridColumn}
                  />
                  {step.buttons.length > 0 && <FormActions nodes={step.buttons} />}
                </FormStep>
              );
            })}

            {buttonNodes.length > 0 && <FormActions nodes={buttonNodes} />}
          </div>
        </FormWrapper>
      </div>
    </FormStatusProvider>
  );
}
