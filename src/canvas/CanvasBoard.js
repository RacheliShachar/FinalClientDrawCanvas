import React, { useState, useEffect, useRef } from 'react';
import { Button, Card } from 'react-bootstrap';
import socketClient from "socket.io-client";
import PeersList from './PeersList';
import Login from "./Login"
const SERVER = "http://127.0.0.1:8086";


const CanvasBoard = (props) => {
    const [currentParticipant, setCurrentParticipant] = useState("");
    const canvasRef = useRef();
    const colorRef = useRef();
    const idRef = useRef();
    let context = null;
    const [channelState, setChannelState] = useState();
    const [socketState, setSocketState] = useState(null)
    const [isLogin, setIsLogin] = useState(true)
    let timeLapse = []

    let sssss;
    let isConnect = false;

    const addPParticipant = (prtcName) => {
        debugger
        configureSocket()
        let newParticipant = { id: channelState.participants, name: prtcName }
        context = canvasRef.current.getContext('2d')
        setCurrentParticipant(newParticipant)
        socketState.emit('add-participant', newParticipant)
        channelState.drawings.forEach((drawing) => {
            drawing.points.forEach((point, i) => {
                if (drawing.points[i + 1]) {
                    if (drawing.points.length - 1 != i || drawing.points.length == 2) {
                        let startPoint = { x: point.x, y: point.y }
                        let endPoint = { x: drawing.points[i + 1].x, y: drawing.points[i + 1].y }
                        draw(startPoint, endPoint, drawing.color)
                    }
                }
            })
        })
    }

    useEffect(() => {
        debugger
        loadChannels();
        configureSocket();
    }, []);

    const loadChannels = async () => {
        fetch('http://localhost:8086/getChannel').then(async response => {
            let data = await response.json();
            setChannelState(data.channel)
        })
    }

    const configureSocket = () => {
        var socket = socketClient(SERVER);
        socket.on('connection', (channel) => {
            console.log(`I'm connected with the back-end`);
            debugger;
            if (!isConnect) {
                setChannelState(channel)
                isConnect = true
            }
        });
        socket.on('add-participant-channel', (c, currenrPrtc) => {
            setChannelState(c)
        });

        socket.on('drawing', c => {
            debugger
            let startPoint = c.drawings[c.drawings.length - 1].points[c.drawings[c.drawings.length - 1].points.length - 2]
            let endPoint = c.drawings[c.drawings.length - 1].points[c.drawings[c.drawings.length - 1].points.length - 1]
            draw(startPoint, endPoint, c.drawings[c.drawings.length - 1].color)
            setChannelState(c)

        });
        socket.on('clear-canvas', (c) => {
            setChannelState(c)
            context.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)
        })
        socket.on('start-drawing', c => {
            setChannelState(c)
        })
        socket.on('selected-color', ch => {
            setChannelState(ch)
        })
        socket.on('reomve-drawings-by-id', (c, currenrPrtcId) => {
            debugger
            setChannelState(c)

        })
        sssss = socket
        setSocketState(socket)

    }


    const handleSendDrawing = (startPoint, endPoint) => {
        debugger
        sssss.emit('send-drawing', { startPoint: startPoint, endPoint: endPoint });
    }
    const handleSendStartDrawing = (startPoint, endPoint) => {
        debugger
        sssss.emit('send-start-drawing', { color: colorRef.current.value, participantId: Number(document.getElementById("current-participant-id").value), startPoint: startPoint });
    }
    const handleChooseColor = (clr) => {
        socketState.emit('choose-color', clr);
    }

    useEffect(() => {

        let mouseDown = false;
        let start = { x: 0, y: 0 };
        let end = { x: 0, y: 0 };
        let canvasOffsetLeft = 0;
        let canvasOffsetTop = 0;

        function handleMouseDown(evt) {
            mouseDown = true;

            start = {
                x: evt.clientX - evt.currentTarget.offsetLeft,
                y: evt.clientY - evt.currentTarget.offsetTop
            };

            end = {
                x: evt.clientX - evt.currentTarget.offsetLeft,
                y: evt.clientY - evt.currentTarget.offsetTop,
            };
            debugger
            handleSendStartDrawing(start, end)

        }

        function handleMouseUp(evt) {
            mouseDown = false;
        }

        function handleMouseMove(evt) {
            debugger;
            let currentColor = document.querySelector('input').value;
            if (mouseDown && context) {
                start = {
                    x: end.x,
                    y: end.y,
                };

                end = {
                    x: evt.clientX - evt.currentTarget.offsetLeft,
                    y: evt.clientY - evt.currentTarget.offsetTop
                };
                debugger;
                handleSendDrawing(start, end)

            }
        }
        if (canvasRef.current) {
            const renderCtx = canvasRef.current.getContext('2d');
            if (renderCtx) {
                canvasRef.current.addEventListener('mousedown', handleMouseDown);
                canvasRef.current.addEventListener('mouseup', handleMouseUp);
                canvasRef.current.addEventListener('mousemove', handleMouseMove);

                canvasOffsetLeft = canvasRef.current.offsetLeft;
                canvasOffsetTop = canvasRef.current.offsetTop;

                context = renderCtx
            }
        }
    }, [context])

    const chooseColor = (e) => {
        debugger
        handleChooseColor(e.target.value)
    }
    const deleteDrawings = () => {
        socketState.emit('delete-drawings')
    }
    const handleReomveDrawinsById = (currenrPrtcId, id, isDisplayDrawings) => {
        socketState.emit('reomve-drawings-by-id', currenrPrtcId, id, isDisplayDrawings)
    }
    const removeDrawingsById = (id, isDisplayDrawings) => {
        debugger
        context = canvasRef.current.getContext('2d')
        context.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)
        handleReomveDrawinsById(currentParticipant.id, id, isDisplayDrawings)
        let c = channelState
        c.participantsArr[currentParticipant.id].displayDrawingsParticipants[id] = isDisplayDrawings
        c.drawings.forEach((drawing, i) => {
            if (c.participantsArr[currentParticipant.id] &&
                c.participantsArr[currentParticipant.id].displayDrawingsParticipants[drawing.participantId] == true) {
                drawing.points.forEach((point, i) => {
                    if (drawing.points[i + 1]) {

                        if (drawing.points.length - 1 != i || drawing.points.length == 2) {
                            let startPoint = { x: point.x, y: point.y }
                            let endPoint = { x: drawing.points[i + 1].x, y: drawing.points[i + 1].y }
                            draw(startPoint, endPoint, drawing.color)
                        }
                    }

                });
            }
        })
    }
    const draw = (startPoint, endPoint, clr) => {
        context.beginPath();
        context.moveTo(startPoint.x, startPoint.y);
        context.lineTo(endPoint.x, endPoint.y);
        context.strokeStyle = clr;
        context.lineWidth = 1;
        context.stroke();
        context.closePath();
    }
  
    return (
        <>
           ‍<canvas ref={canvasRef} className="canvas" id="drawCanvas" style={{ position: "absolute", top: "5vh", border: "solid black 2px", opacity: isLogin ? "0" : "1" }} ></canvas>   ‍
             <div style={{ position: "relative" }} className="d-flex justify-content-center">
                {

                    isLogin ?
                        <Card
                            text='dark'
                            style={{ width: '19rem', position: "absolute", top: "0vh" }}
                            className="mb-2"
                        >
                            <Card.Header>Name</Card.Header>
                            <Card.Body>
                                <Card.Text>
                                    <Login setIsLogin={setIsLogin} addPParticipant={addPParticipant} />
                                </Card.Text>
                            </Card.Body>
                        </Card>

                        :

                        <Card
                            text='dark'
                            style={{ width: '19rem', position: "absolute", top: "35vh" }}
                            className="mb-2"
                        >
                            <Card.Header>Hello {currentParticipant.name}</Card.Header>
                            <Card.Body>
                                <Card.Title>

                                    <input id="current-participant-id" ref={idRef} type="text" defaultValue={currentParticipant.id} style={{ opacity: "0" }} />
                                    <Button variant="secondary" onClick={(e) => deleteDrawings()}>Clear All Canvases</Button>
                                </Card.Title>
                                <Card.Text>
                                    Choose Color:
                                    <input className="ml-3" id="input-color" type="color" ref={colorRef} style={{ width: "30px", border: "none" }} onChange={(e) => { chooseColor(e) }} />
                                </Card.Text>
                                <Card.Text>
                                    {
                                        channelState ?
                                            channelState.participantsArr ?
                                                channelState.participantsArr.map((p) => {
                                                    if (currentParticipant.id != p.id) {
                                                        return <PeersList key={p.id} id={p.id} name={p.name} isConnect={p.isConnect} removeDrawingsById={removeDrawingsById} />
                                                    }
                                                })
                                                : null : null
                                    }
                                </Card.Text>
                            </Card.Body>
                        </Card>
                }
            </div>
        </>
    )
}
export default CanvasBoard;