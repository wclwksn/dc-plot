/**
 * @Author: Caven
 * @Date: 2020-08-30 22:39:34
 */

import Edit from './Edit'

const { Transform } = DC

const { Cesium } = DC.Namespace

class EditPolyline extends Edit {
  constructor(plot, overlay) {
    super(plot)
    this._overlay = overlay
    this._positions = []
    this._mountEntity()
    this._mountAnchor()
  }

  _mountEntity() {
    this._delegate = new Cesium.Entity()
    this._delegate.merge(this._overlay.delegate)
    this._overlay.show = false
    this._delegate.polyline.positions = new Cesium.CallbackProperty(time => {
      if (this._positions > 1) {
        return this._positions
      } else {
        return null
      }
    }, false)
    this._plot.overlayLayer.add(this._delegate)
  }

  _mountAnchor() {
    let positions = [].concat(
      this._overlay.delegate.polyline.positions.getValue(
        Cesium.JulianDate.now()
      )
    )
    for (let i = 0; i < positions.length - 1; i++) {
      let mid = this.computeMidPosition(positions[i], positions[i + 1])
      this._positions.push(positions[i])
      this._positions.push(mid)
    }
    this._positions.push(positions[positions.length - 1])
    this._positions.forEach((item, index) => {
      this.createAnchor(item, index, index % 2 !== 0)
    })
  }

  _mouseClickHandler(e) {
    if (this._isMoving) {
      this._isMoving = false
      if (this._pickedAnchor && this._pickedAnchor.position) {
        this._pickedAnchor.position.setValue(e.surfacePosition)
        let properties = this._pickedAnchor.properties.getValue(
          Cesium.JulianDate.now()
        )
        if (properties.isMid) {
          let preMidPosition = this.computeMidPosition(
            this._positions[properties.index],
            this._positions[properties.index - 1]
          )
          let nextMidPosition = this.computeMidPosition(
            this._positions[properties.index],
            this._positions[properties.index + 1]
          )
          this._plot.anchorLayer.removeAll()
          this._anchors = []
          this._positions.splice(
            properties.index,
            1,
            preMidPosition,
            e.surfacePosition,
            nextMidPosition
          )
          this._positions.forEach((item, index) => {
            this.createAnchor(item, index, index % 2 !== 0)
          })
        }
      }
    } else {
      this._isMoving = true
      if (!e.target.id) {
        return false
      }
      this._pickedAnchor = e.target.id
    }
  }

  _mouseMoveHandler(e) {
    this._plot.viewer.tooltip.showAt(
      e.windowPosition,
      '点击锚点移动,右击结束编辑'
    )
    if (!this._isMoving) {
      return
    }
    if (this._pickedAnchor && this._pickedAnchor.position) {
      let properties = this._pickedAnchor.properties.getValue(
        Cesium.JulianDate.now()
      )
      this._pickedAnchor.position.setValue(e.surfacePosition)
      this._positions[properties.index] = e.surfacePosition
      if (!properties.isMid) {
        let currentIndex = properties.index
        let preAnchorIndex = -1
        let preMidAnchorIndex = -1
        let nextAnchorIndex = -1
        let nextMidAnchorIndex = -1
        let len = this._positions.length
        if (currentIndex === 0) {
          nextAnchorIndex = currentIndex + 2
          nextMidAnchorIndex = currentIndex + 1
        } else if (properties.index === len - 1) {
          preAnchorIndex = currentIndex - 2
          preMidAnchorIndex = currentIndex - 1
        } else {
          preAnchorIndex = currentIndex - 2
          preMidAnchorIndex = currentIndex - 1
          nextAnchorIndex = currentIndex + 2
          nextMidAnchorIndex = currentIndex + 1
        }

        if (preAnchorIndex > 0) {
          let preMidPosition = this.computeMidPosition(
            this._positions[preAnchorIndex],
            this._positions[currentIndex]
          )
          this._positions[preMidAnchorIndex] = preMidPosition
          this._anchors[preMidAnchorIndex].position.setValue(preMidPosition)
        }

        if (nextAnchorIndex > 0) {
          let nextMidPosition = this.computeMidPosition(
            this._positions[nextAnchorIndex],
            this._positions[currentIndex]
          )
          this._positions[nextMidAnchorIndex] = nextMidPosition
          this._anchors[nextMidAnchorIndex].position.setValue(nextMidPosition)
        }
      }
    }
  }

  _mouseRightClickHandler(e) {
    this.unbindEvent()
    this._overlay.positions = Transform.transformCartesianArrayToWGS84Array(
      this._positions
    )
    this._overlay.show = true
    this._plot.plotEvent.raiseEvent(this._overlay)
  }
}

export default EditPolyline
