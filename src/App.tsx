import './App.css'
import "@fontsource/istok-web/400.css"
import "@fontsource/istok-web/700.css"
import {
    DndContext,
    closestCenter,
    useDraggable,
    useDroppable
} from "@dnd-kit/core"
import {useDropzone} from "react-dropzone";
import { Export } from "@phosphor-icons/react";
import {toPng} from "html-to-image";
import {useCallback, useRef, useState} from "react";

interface DroppableProps {
    id: string;
    children: React.ReactNode;
}

function Droppable({id, children}: DroppableProps) {
    const { isOver, setNodeRef } = useDroppable({ id })
    const style = {
        backgroundColor: isOver ? '#f0f0f0' : undefined,
        padding: '4px',
        minHeight: '80px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
    }

    return (
        <div ref={setNodeRef} style={style}>
            {children}
        </div>
    )
}

interface DraggableProps {
    id: string;
    image: string;
    children?: React.ReactNode;
}

function Draggable({id, image}: DraggableProps) {
    const { attributes, listeners, setNodeRef, transform } = useDraggable({
        id,
    })

    const style = {
        transform: transform
            ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
            : undefined,
        touchAction: 'none',
        background: `url(${image})`,
    }

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...listeners}
            {...attributes}

            className={`size-[80px] rounded-md !bg-cover !bg-center`}
        >
        </div>
    )
}

interface TierProps {
    name: string;
    background: string;
    images: Array<{
        id: string;
        label: string;
        url: string;
    }>;
    handleImageDrop: (tierName: string, files: File[]) => void;
}

const Tier = (tier: TierProps) => {
    const onDrop = useCallback((acceptedFiles: File[]) => {
        // Do something with the files
        tier.handleImageDrop(tier.name, acceptedFiles)
    }, [])
    const {getRootProps, getInputProps, isDragActive} = useDropzone({onDrop})
    return  <Droppable key={tier.name} id={tier.name}>
        <div {...getRootProps()} className="flex  gap-4  w-full">
            <input {...getInputProps()} />


            <div
                style={{ background: tier.background }}
                className=" text-lg font-semibold  size-24 text-white flex justify-center items-center rounded-[10px]"
            >
                { tier.name}
            </div>

            <div  className={isDragActive? "bg-black/10   min-h-22 w-22  rounded-[10px] w-full flex  flex-wrap gap-2 p-2": "border-[#C8C8C8] flex-wrap  min-h-22 w-22 border-[1px] rounded-[10px] w-full flex gap-2 p-2"}>
                {tier.images.map((item) => (
                    <Draggable image={item.url} key={item.id} id={item.id}>
                        {item.label}
                    </Draggable>
                ))}
            </div>
        </div>
    </Droppable>
}

function App() {
    interface TierState {
        name: string;
        background: string;
        images: Array<{
            id: string;
            label: string;
            url: string;
        }>;
    }

    const [tiers, setTiers] = useState<TierState[]>([
        { name: 'S', background: '#FF9C9C', images: [] },
        { name: 'B', background: '#FFB163', images: [] },
        { name: 'C', background: '#FFD86C', images: [] },
        { name: 'D', background: '#DFE44E', images: [] },
        { name: 'F', background: '#9FA9A3', images: [] },
    ])



    const handleImageDrop = (tier_name: string, files: File & any[]) => {
        setTiers((tiersx) => {
            const tiers = [...tiersx];
            const tier = tiers.find(y => y.name === tier_name);
            for (const file of files) {
                if (tier?.images) {
                    tier.images = [...tier.images, {
                        id: `${file.name}-${Math.round(+new Date()/1000)}`,
                        label: file.name,
                        url: URL.createObjectURL(file)
                    } as any]
                }
            }

            return [...tiers]

        })
    }

    const ref = useRef<HTMLDivElement>(null)

    const onButtonClick = useCallback(() => {
        if (ref.current === null) {
            return
        }

        toPng(ref.current, { cacheBust: false, width: ref.current.clientWidth+230, height: ref.current.clientHeight, backgroundColor:'white' })
            .then((dataUrl) => {
                const link = document.createElement('a')
                link.download = 'tier.png'
                link.href = dataUrl
                link.click()
            })
            .catch((err) => {
                console.log(err)
            })
    }, [ref])


    interface DragEndEvent {
        active: { id: string };
        over: { id: string } | null;
    }

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event

        if (!over || active.id === over.id) return

        // Remove from source
        const item = tiers.map(x => x.images).flat(1).find(i => i.id === active.id)
        const updatedTiers = tiers.map(tier => {
            const existing = tier.images.find(i => i.id === active.id)
            if (existing) {
                tier.images = tier.images.filter(i => i.id !== active.id)
            }
            return tier
        })

        // Place into target
        const targetIndex = updatedTiers.findIndex(t => t.name === over.id)
        if (targetIndex !== -1) {
            updatedTiers[targetIndex].images.push(item as any)
        }

        setTiers(updatedTiers)
    }

    return (
        <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd as any}>
            <div  className="text-black text-center pt-12">
                <img src={'/logo.png'} className={"max-w-72 m-auto"}/>
                <p className="text-[18px] mt-2 text-neutral-600">
                    Drag and drop images into the tiers
                </p>

                <div onClick={onButtonClick} className={'bg-black  hover:cursor-pointer px-4 py-1 gap-3 text-sm text-white mt-6 w-max m-auto rounded-[6px] flex justify-center items-center'}>
                    <Export weight={'fill'} size={20}/> Export to PNG
                </div>

                <div  >
                    <div ref={ref}  className="space-y-4 w-[80%] pb-12 mt-9 m-auto">
                        {tiers.map((tier) => (
                            <Tier handleImageDrop={handleImageDrop as any} {...tier}/>
                        ))}
                    </div>
                </div>


            </div>
        </DndContext>
    )
}

export default App
