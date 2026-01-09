import PropertyPanelText from './Text'
import PropertyPanelImage from './Image'
import PropertyPanelShape from './Shape'
import PropertyPanelBackground from './Background'
import PropertyPanelAdFrame from './AdFrame'
import PropertyPanelFrame from './Frame'

const PROPERTY_PANEL_REGISTRY: any = {
  text: PropertyPanelText,
  image: PropertyPanelImage,
  shape: PropertyPanelShape,
  background: PropertyPanelBackground,
  ad: PropertyPanelAdFrame,
  frame: PropertyPanelFrame,
}

export default function PropertyPanel({
  selectedElement,
  background,
  onElementUpdate,
  onBackgroundUpdate,
  onElementRemove,
  onFrameUpdate,
  storyDefaultDurationMs,
}: any) {
  const type =
    selectedElement?.type ||
    (selectedElement === undefined ? 'background' : null)
  const PanelComponent = PROPERTY_PANEL_REGISTRY[type]

  return (
    <div
      className="h-full w-80 overflow-y-auto border-l bg-background p-4"
      style={{ maxHeight: '100vh' }}
    >
      {PanelComponent ? (
        <PanelComponent
          element={selectedElement}
          background={background}
          onElementUpdate={onElementUpdate}
          onBackgroundUpdate={onBackgroundUpdate}
          onElementRemove={onElementRemove}
          onFrameUpdate={onFrameUpdate}
          storyDefaultDurationMs={storyDefaultDurationMs}
        />
      ) : (
        <div className="p-4 text-gray-400">No properties available.</div>
      )}
    </div>
  )
}
