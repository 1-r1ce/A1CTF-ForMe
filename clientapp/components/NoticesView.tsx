
import {
    animated,
    useTransition,
} from '@react-spring/web'

import { Dispatch, MutableRefObject, SetStateAction, useEffect, useRef, useState } from "react";
import { Button } from "./ui/button";
import { CalendarClock, CircleX, X } from "lucide-react";
import dayjs from "dayjs";
import { GameNotice, NoticeCategory } from "utils/A1API";
import { Mdx } from "./MdxCompoents";
import { useTranslation } from "react-i18next";
import { useTheme } from "next-themes";
import { MacScrollbar } from "mac-scrollbar";

let messages: GameNotice[] = []

const calcTranslateX = (index: number) => {
    const width = window.innerWidth;
    const boxWidth = (width >= 1024 ? 600 : 300);
    return `${((width - boxWidth) / 2) + boxWidth}px`
}

const calcTranslateY = (index: number) => {
    const height = window.innerHeight

    let boxHeight = 0
    let untilCurBoxHeight = 0

    // 估计信息盒子的高度
    messages.forEach((ele, curIndex) => {
        // 先根据换行符拆开
        const lines = ele.data[0].split("\n")

        // 当前盒子的高度
        let curBoxHeight = 64
        // 基础的 内外高度
        boxHeight += 64

        lines.forEach((line) => {
            const line_count = Math.ceil(line.length / 68)
            // 测试得到一行文本的高度大概为 24
            boxHeight += line_count * 24
            curBoxHeight += line_count * 24
        })

        // gap 为 16px
        boxHeight += 16
        curBoxHeight += 16

        if (curIndex <= index) untilCurBoxHeight += curBoxHeight
    })

    boxHeight = Math.min(boxHeight, height - 80)

    const paddingTop = (height - boxHeight) / 2
    return `-${untilCurBoxHeight + paddingTop + 40}px`
}

const shouldAnimated = (index: number) => {
    const height = window.innerHeight

    let boxHeight = 0
    let untilCurBoxHeight = 0

    // 估计信息盒子的高度
    messages.forEach((ele, curIndex) => {
        // 先根据换行符拆开
        const lines = ele.data[0].split("\n")

        // 当前盒子的高度
        let curBoxHeight = 64
        // 基础的 内外高度
        boxHeight += 64

        lines.forEach((line) => {
            const line_count = Math.ceil(line.length / 68)
            // 测试得到一行文本的高度大概为 24
            boxHeight += line_count * 24
            curBoxHeight += line_count * 24
        })

        // gap 为 16px
        boxHeight += 16
        curBoxHeight += 16

        if (curIndex < index) untilCurBoxHeight += curBoxHeight
    })

    boxHeight = Math.min(boxHeight, height - 80)
    const paddingTop = (height - boxHeight) / 2

    return (untilCurBoxHeight + paddingTop) < height - 40
}

export function NoticesView({ opened, setOpened, notices }: { opened: boolean, setOpened: Dispatch<SetStateAction<boolean>>, notices: GameNotice[] }) {

    messages = notices

    const { t } = useTranslation("notices_view")
    const { theme } = useTheme();

    // 消息卡片的可见列表
    const [visible, setVisible] = useState<boolean>(false)
    // 背景模糊的可见
    const [visible2, setVisible2] = useState<boolean>(false)

    // 延迟和动画时间
    const [durationTime, setDurationTime] = useState<Record<string, number>>({})
    const [delayTime, setDelayTime] = useState<Record<string, number>>({})

    // 懒加载，屏幕外面的消息卡片不需要动画时间
    const observerRef = useRef<IntersectionObserver | null>(null);
    const [visibleItems, setVisibleItems] = useState<Record<string, boolean>>({});

    useEffect(() => {

        // 观察
        observerRef.current = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                const target = entry.target as HTMLElement;
                const id = target.dataset.id as string;

                if (entry.isIntersecting) {
                    setVisibleItems((prev) => ({
                        ...prev,
                        [id]: true
                    }));
                } else {
                    setVisibleItems((prev) => ({
                        ...prev,
                        [id]: false
                    }));
                }
            }
            );
        },
            {
                rootMargin: "200px 0px",
            });

        // 打开公告列表前计算每一个元素的动画时间和延迟列表
        if (opened) {
            const newDelayTime: Record<string, number> = {};
            const newDurationTime: Record<string, number> = {};

            // 由于刚打开元素没有渲染，无法得知真实宽度，只能计算得出 shouldAnimated 就是根据模拟计算出来的宽度来判断是否在屏幕内
            messages.forEach((ele, index) => {
                newDurationTime[index.toString()] = shouldAnimated(index) ? 0.9 : 0
                newDelayTime[index.toString()] = shouldAnimated(index) ? 0.1 * index : 0
            })

            // 更新
            setDelayTime(newDelayTime)
            setDurationTime(newDurationTime)

            // 计算完成后设置可视状态
            setVisible(true)
            setVisible2(true)
        } else {
            // 关闭动画由于已经渲染卡片，可以直接得到这个卡片是否在屏幕外面或者里面
            const newDelayTime: Record<string, number> = {};
            const newDurationTime: Record<string, number> = {};

            let countVar1 = 0
            let foundTop = false

            // 第一步找到有多少个可见的，第一张可见卡片前面的卡片需要在所有可视卡片动画完成后瞬间消失
            // 也就是 duration = 0, delay = visibleCount * 0.1
            let visibleCount = 0
            Object.values(visibleItems).forEach((value) => { visibleCount += value ? 1 : 0 })

            // 计算每一张卡片的动画时间和延迟时间
            messages.forEach((ele, index) => {
                newDurationTime[index.toString()] = visibleItems[index.toString()] ? 0.9 : 0

                if (visibleItems[index.toString()]) {
                    newDelayTime[index.toString()] = 0.1 * countVar1
                    countVar1 += 1
                    foundTop = true
                } else {
                    if (!foundTop) {
                        // 第一张可视卡片前面的卡片延迟时间都为 0.1 * 可视卡片的数量
                        newDelayTime[index.toString()] = 0.1 * visibleCount
                    } else {
                        // 后面的全部瞬间消失
                        newDelayTime[index.toString()] = 0
                    }
                }
            })

            setDelayTime(newDelayTime)
            setDurationTime(newDurationTime)
        }
    }, [opened])

    useEffect(() => {
        // 关闭盒子
        if (!opened) {
            let visibleCount = 0
            Object.values(visibleItems).forEach((value) => { visibleCount += value ? 1 : 0 })
            setVisible(false)

            // 等卡片动画结束再进行背景动画
            setTimeout(() => {
                setVisible2(false)
            }, Math.min((900 + 100 * (visibleCount)) - 500, 2000))
        }
    }, [durationTime])

    const getNoticeMessage = (notice: GameNotice) => {
        switch (notice.notice_category) {
            case NoticeCategory.NewAnnouncement:
                return (<Mdx source={notice.data[0]}></Mdx>)
            case NoticeCategory.FirstBlood:
                return (<span>{`🥇 ${notice.data[0]} ${t("blood_message_p1")} ${notice.data[1]} ${t("blood1")}`}</span>)
            case NoticeCategory.SecondBlood:
                return (<span>{`🥈 ${notice.data[0]} 获得了 ${notice.data[1]} ${t("blood2")}`}</span>)
            case NoticeCategory.ThirdBlood:
                return (<span>{`🥉 ${notice.data[0]} 获得了 ${notice.data[1]} ${t("blood3")}`}</span>)
        }
    }

    // 观察器
    const observeItem = (el: HTMLElement, id: string) => {
        if (el && observerRef.current) {
            el.dataset.id = id;
            observerRef.current.observe(el);
        }
    };

    const transitions = useTransition(visible, {
        from: {
            opacity: 0,
            backdropFilter: 'blur(0px)',
            backgroundColor: 'rgba(0, 0, 0, 0)',
            transform: 'translateY(40px)'
        },
        enter: {
            opacity: 1,
            backdropFilter: 'blur(4px)',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            transform: 'translateY(0)'
        },
        leave: {
            opacity: 0,
            backdropFilter: 'blur(0px)',
            backgroundColor: 'rgba(0, 0, 0, 0)',
            transform: 'translateY(40px)'
        },
        config: { tension: 220, friction: 20 }
    });


    return (
        transitions((style, visible2) =>
            visible2 && (
                <div>
                    <animated.div className="absolute top-0 left-0 w-screen h-screen z-30"
                        style={{
                            opacity: style.opacity,
                            backgroundColor: style.backgroundColor,
                            backdropFilter: style.backdropFilter
                        }}
                    >

                    </animated.div>
                    <animated.div
                        className="absolute top-0 left-0 w-screen h-screen flex justify-center items-center z-30 overflow-hidden"
                        style={{
                            opacity: style.opacity,
                        }}
                    >
                        <MacScrollbar className="w-full h-full flex-1" skin={theme === "dark" ? "dark" : "light"}>
                            <div className="w-full flex flex-col items-center">
                                <div className="container flex flex-col gap-4 items-center justify-center">
                                    <div className="w-full p-10 pb-0 mb-8 flex items-center">
                                        <span className="font-bold text-3xl">Announcements</span>
                                        <div className="flex-1" />
                                        <Button className='w-[50px] h-[50px] [&_svg]:size-8 rounded-lg' variant="default"
                                            onClick={() => {
                                                setOpened(false)
                                            }}
                                        >
                                            <X />
                                        </Button>
                                    </div>
                                    {messages.map((mes, index) => (
                                        <div
                                            key={`message-${index}`}
                                            className={
                                                `relative overflow-hidden flex-none transition-all duration-300 group ` +
                                                `rounded-2xl shadow-lg border border-foreground/10 ` +
                                                `bg-gradient-to-br ` +
                                                (theme === 'dark'
                                                    ? 'from-[#23272f]/80 to-[#181a20]/90 hover:from-[#23272f]/90 hover:to-[#23272f]/95'
                                                    : 'from-white/90 to-gray-100/80 hover:from-white/95 hover:to-gray-200/90') +
                                                ' hover:scale-[1.005] hover:shadow-2xl w-full'
                                            }
                                        >
                                            <div className="flex flex-col gap-2 px-6 pt-5 pb-4">
                                                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-6 select-none mb-2">
                                                    <div className="flex gap-4 items-center">
                                                        <CalendarClock className="text-blue-400" />
                                                        <span className="font-bold text-base sm:text-lg tracking-wide">{dayjs(mes.create_time).format("YYYY-MM-DD HH:mm:ss")}</span>
                                                    </div>
                                                </div>
                                                <div className="border-t border-dashed border-foreground/10" />
                                                <div className="prose prose-sm sm:prose-base max-w-none text-foreground/90 dark:text-foreground/80 mt-2 break-words overflow-x-auto">
                                                    {getNoticeMessage(mes)}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                            </div>
                        </MacScrollbar>
                    </animated.div>
                </div>
            ))
    )
}