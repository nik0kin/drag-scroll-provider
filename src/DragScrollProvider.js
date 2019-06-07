/*eslint no-restricted-globals: 0*/

import React, { Component } from 'react'

const DEFAULT_THRESHOLD = 0.15

const sLeft = 'scrollLeft'
const sTop = 'scrollTop'

export default class DragScrollProvider extends Component {
    constructor(props) {
        super(props)
        this.privateState = {
            isMouseDown: false,
            lastMousePosition: {
                x: null,
                y: null
            },
            startTime: null,
        }
        this.refElement = null
        this.clearListeners = []
    }

    setPrivateState(state) {
        this.privateState = { ...this.privateState, ...state }
    }

    addEventListenerWithClear(type, func) {
        this.refElement.addEventListener(type, func)
        const clear = this.removeListenerFactory(type, func)
        this.clearListeners.push(clear)
    }

    removeListenerFactory(eventName, listener) {
        return () => removeEventListener(eventName, listener)
    }

    componentDidMount() {
        this.threshold = this.props.threshold || DEFAULT_THRESHOLD
        this.addEventListenerWithClear('mouseup', this.onMouseUp)
        this.addEventListenerWithClear('mousemove', this.onMouseMove)
    }

    componentWillUnmount() {
        this.clearListeners.forEach(clear => clear())
    }

    keepScrolling(acceleration) {
        const max = {
            x: this.refElement.scrollWidth - this.refElement.offsetWidth,
            y: this.refElement.scrollHeight - this.refElement.offsetHeight,
        }
        this.animation = setTimeout(() => {
            const scrollX = this.refElement[sLeft]
            const scrollY = this.refElement[sTop]
            if (acceleration.x !== 0 || acceleration.y !== 0) {
                if (acceleration.x !== 0 && scrollX !== 0 && scrollX !== max.x) {
                    this.refElement[sLeft] += acceleration.x
                    acceleration.x =
                        acceleration.x > 0 ? acceleration.x - 1 : acceleration.x + 1
                }
                if (acceleration.y !== 0 && scrollY !== 0 && scrollY !== max.y) {
                    this.refElement[sTop] += acceleration.y
                    acceleration.y =
                        acceleration.y > 0 ? acceleration.y - 1 : acceleration.y + 1
                }

                return this.keepScrolling(acceleration)
            }
        }, 10)
    }

    onMouseMove = event => {
        const { isMouseDown, lastMousePosition } = this.privateState
        if (!isMouseDown) {
            return null
        }

        if (this.refElement === null) {
            return null
        }

        if (lastMousePosition === null) {
            return null
        }
        this.refElement[sLeft] +=
            lastMousePosition.x - event.clientX
        this.refElement[sTop] +=
            lastMousePosition.y - event.clientY
        this.setPrivateState({
            lastMousePosition: {
                x: event.clientX,
                y: event.clientY
            }
        })
    }

    onMouseUp = () => {
        const { startTime, positionStart } = this.privateState
        const positionEnd = {
            x: this.refElement[sLeft],
            y: this.refElement[sTop]
        }
        const distance = {
            x: positionEnd.x - positionStart.x,
            y: positionEnd.y - positionStart.y
        }
        const time = (new Date() - startTime) / 1000
        const velocity = {
            x: Math.round(distance.x / time),
            y: Math.round(distance.y / time)
        }
        const acceleration = {
            x: Math.round(velocity.x / time / 100),
            y: Math.round(velocity.y / time / 100)
        }
        this.setPrivateState({
            isMouseDown: false,
            lastMousePosition: null,
            time,
        })
        this.keepScrolling(acceleration)
    }

    provisionOnMouseDown = event => {
        if (this.animation) {
            clearTimeout(this.animation)
        }
        this.setPrivateState({
            isMouseDown: true,
            lastMousePosition: {
                x: event.clientX,
                y: event.clientY
            },
            startTime: new Date(),
            positionStart: {
                x: this.refElement[sLeft],
                y: this.refElement[sTop]
            }
        })
    }

    provisionRef = element => {
        this.refElement = element
    }

    scrollRight = () => {
        this.refElement.classList.add('dragScroll')
        this.refElement.scrollLeft += this.props.scrollDistance
        this.refElement.classList.remove('dragScroll')
    }

    scrollLeft = () => {
        this.refElement.classList.add('dragScroll')
        this.refElement.scrollLeft -= this.props.scrollDistance
        this.refElement.classList.remove('dragScroll')
    }

    scrollTo = position => {
        if (!this.refElement) {
            return null
        }
        this.refElement.classList.add('dragScroll')
        this.refElement.scrollLeft = position
        this.refElement.classList.remove('dragScroll')
    }

    clickItem = callback => {
        const { time } = this.privateState
        if (!time || time > this.threshold) {
            return null
        }
        return callback()
    }

    render() {
        return this.props.children({
            onMouseDown: this.provisionOnMouseDown,
            clickItem: this.clickItem,
            ref: this.provisionRef,
            scrollRight: this.scrollRight,
            scrollLeft: this.scrollLeft,
            scrollTo: this.scrollTo,
        })
    }
}
