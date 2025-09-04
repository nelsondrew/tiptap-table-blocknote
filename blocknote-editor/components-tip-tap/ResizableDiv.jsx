import React, { useState, useRef, useEffect } from "react";
import { unstable_batchedUpdates } from "react-dom";

const ResizableDiv = ({ children, onResize, dimensions, setDimensions, editMode, editorContainerWidth , viewWidth }) => {
    const isResizingRight = useRef(false);
    const isResizingBottom = useRef(false);
    const isResizingCorner = useRef(false);

    useEffect(() => {
        onResize(dimensions);
    }, [dimensions])

    const handleMouseDownRight = (e) => {
        isResizingRight.current = true;
        const startX = e.clientX;
        const startWidth = dimensions.width;

        const handleMouseMove = (event) => {
            if (isResizingRight.current) {
                const newWidth = startWidth + (event.clientX - startX);
                if (editorContainerWidth > 0 && newWidth >= editorContainerWidth) return;
                requestAnimationFrame(() => {
                    unstable_batchedUpdates(() => {
                        setDimensions((prev) => ({ ...prev, width: Math.max(newWidth, 100) }));
                    })
                })
            }
        };

        const handleMouseUp = () => {
            isResizingRight.current = false;
            document.removeEventListener("mousemove", handleMouseMove);
            document.removeEventListener("mouseup", handleMouseUp);
        };

        document.addEventListener("mousemove", handleMouseMove);
        document.addEventListener("mouseup", handleMouseUp);
    };

    const handleMouseDownBottom = (e) => {
        isResizingBottom.current = true;
        const startY = e.clientY;
        const startHeight = dimensions.height;

        const handleMouseMove = (event) => {
            if (isResizingBottom.current) {
                const newHeight = startHeight + (event.clientY - startY);
                requestAnimationFrame(() => {
                    unstable_batchedUpdates(() => {
                        setDimensions((prev) => ({
                            ...prev,
                            height: Math.max(newHeight, 100),
                        }));
                    })
                })

            }
        };

        const handleMouseUp = () => {
            isResizingBottom.current = false;
            document.removeEventListener("mousemove", handleMouseMove);
            document.removeEventListener("mouseup", handleMouseUp);
        };

        document.addEventListener("mousemove", handleMouseMove);
        document.addEventListener("mouseup", handleMouseUp);
    };

    const handleMouseDownCorner = (e) => {
        isResizingCorner.current = true;
        const startX = e.clientX;
        const startY = e.clientY;
        const startWidth = dimensions.width;
        const startHeight = dimensions.height;

        const handleMouseMove = (event) => {
            if (isResizingCorner.current) {
                let newWidth = startWidth + (event.clientX - startX);
                const newHeight = startHeight + (event.clientY - startY);
                let shouldUpdateWidth = true;
                if (editorContainerWidth > 0 && newWidth >= editorContainerWidth) {
                    shouldUpdateWidth = false;
                }

                requestAnimationFrame(() => {
                    unstable_batchedUpdates(() => {
                        if (shouldUpdateWidth) {
                            setDimensions({
                                width: Math.max(newWidth, 100),
                                height: Math.max(newHeight, 100),
                            });
                        } else {
                            setDimensions((prev) => ({
                                ...prev,
                                height: Math.max(newHeight, 100),
                            }));
                        }

                    })
                })

            }
        };

        const handleMouseUp = () => {
            isResizingCorner.current = false;
            document.removeEventListener("mousemove", handleMouseMove);
            document.removeEventListener("mouseup", handleMouseUp);
        };

        document.addEventListener("mousemove", handleMouseMove);
        document.addEventListener("mouseup", handleMouseUp);
    };

    return (
        <div
            style={{
                width: `${!editMode && viewWidth > 0  ? viewWidth * 1.5 : dimensions.width }px`,
                height: `${dimensions.height}px`,
                position: "relative",
                overflow: "hidden",
            }}
        >
            {children}
            {editMode && (
                <>
                    <div
                        onMouseDown={handleMouseDownRight}
                        style={{
                            width: "10px",
                            height: "100%",
                            backgroundColor: 'transparent',
                            position: "absolute",
                            top: "0",
                            right: "0",
                            cursor: "ew-resize",
                            zIndex: 99
                        }}
                    ></div>
                    <div
                        onMouseDown={handleMouseDownBottom}
                        style={{
                            width: "100%",
                            height: "10px",
                            backgroundColor: 'transparent',
                            position: "absolute",
                            bottom: "0",
                            left: "0",
                            cursor: "ns-resize",
                            zIndex: 99
                        }}
                    ></div>
                    <div
                        onMouseDown={handleMouseDownCorner}
                        style={{
                            width: "10px",
                            height: "10px",
                            backgroundColor: 'transparent',
                            position: "absolute",
                            bottom: "0",
                            right: "0",
                            cursor: "nwse-resize",
                            zIndex: 99,
                        }}
                    ></div>
                </>
            )}

        </div>
    );
};

export default ResizableDiv;

