/**
 * @Author: Caven
 * @Date: 2020-08-30 16:43:12
 */

import Draw from './Draw'
import DoubleArrowGraphics from '../graphics/DoubleArrowGraphics'

const { Transform } = DC

const { Cesium } = DC.Namespace

const DEF_STYLE = {
  material: Cesium.Color.YELLOW.withAlpha(0.6),
  fill: true
}

class DrawDoubleArrow extends Draw {
  constructor(plot, style) {
    super(plot)
    this._positions = []
    this._floatingAnchor = undefined
    this._style = {
      ...DEF_STYLE,
      ...style
    }
    this._graphics = new DoubleArrowGraphics()
    this._mountEntity()
  }

  _mountEntity() {
    this._delegate = new Cesium.Entity({
      polygon: {
        ...this._style,
        hierarchy: new Cesium.CallbackProperty(() => {
          if (this._positions.length > 2) {
            this._graphics.positions = this._positions
            return this._graphics.hierarchy
          } else {
            return null
          }
        }, false)
      }
    })
    this._plot.overlayLayer.add(this._delegate)
  }

  _mouseClickHandler(e) {
    let len = this._positions.length
    if (len === 0) {
      this._positions.push(e.surfacePosition)
      this.createAnchor(e.surfacePosition)
      this._floatingAnchor = this.createAnchor(e.surfacePosition)
    }
    this._positions.push(e.surfacePosition)
    this._graphics.positions = this._positions
    this.createAnchor(e.surfacePosition)
    if (len > 3) {
      this._positions.pop()
      this.unbindEvent()
      let doubleArrow = new DC.DoubleArrow(
        Transform.transformCartesianArrayToWGS84Array(this._positions)
      )
      doubleArrow.setStyle(this._style)
      this._plot.plotEvent.raiseEvent(doubleArrow)
    }
  }

  _mouseMoveHandler(e) {
    this._plot.viewer.tooltip.showAt(e.windowPosition, '单击选择点位')
    if (this._floatingAnchor) {
      this._floatingAnchor.position.setValue(e.surfacePosition)
      this._positions.pop()
      this._positions.push(e.surfacePosition)
    }
  }
}

export default DrawDoubleArrow
