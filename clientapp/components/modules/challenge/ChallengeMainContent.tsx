import { Button } from "components/ui/button"
import { AlarmClock, AudioWaveform, ChartNoAxesCombined, CheckCheck, CirclePower, CircleX, ClockArrowUp, Flag, Loader2, Network, Package, Paperclip } from "lucide-react"
import { MacScrollbar } from "mac-scrollbar"
import TimerDisplay from "../TimerDisplay"
import { ContainerStatus, ExposePortInfo, GameScoreboardData, UserDetailGameChallenge, UserFullGameInfo } from "utils/A1API"
import { ChallengeSolveStatus } from "components/ChallengesView"
import { Dispatch, SetStateAction, useEffect, useMemo, useState } from "react"
import { api } from "utils/ApiHelper"
import { randomInt } from "mathjs"
import dayjs from "dayjs"
import { Mdx } from "components/MdxCompoents"
import { toast } from "sonner"
import { useTranslation } from "react-i18next"
import ChallengeNameTitle from "./ChallengeNameTitle"
import { useTheme } from "next-themes"
import FileDownloader from "./FileDownloader"
import copy from "copy-to-clipboard"

export default function ChallengeMainContent(
    { 
        gameID,
        curChallenge,
        challengeSolveStatusList,
        setSubmitFlagWindowVisible,
        gameInfo,
        setShowHintsWindowVisible,
        setRedirectURL,
        scoreBoardModel
    } : {
        gameID: number,
        curChallenge: UserDetailGameChallenge | undefined,
        challengeSolveStatusList: Record<number, ChallengeSolveStatus>,
        setSubmitFlagWindowVisible: Dispatch<SetStateAction<boolean>>,
        gameInfo: UserFullGameInfo | undefined,
        setShowHintsWindowVisible: Dispatch<SetStateAction<boolean>>,
        setRedirectURL: Dispatch<SetStateAction<string>>,
        scoreBoardModel: GameScoreboardData | undefined
    }
) {

    const { t } = useTranslation()

    

    const rankColor = (rank: number) => {
        if (rank == 1) return "text-red-400 font-bold"
        else if (rank == 2) return "text-green-400 font-bold"
        else if (rank == 3) return "text-blue-400 font-bold"
        else return ""
    }

    const [containerLaunching, setContainerLaunching] = useState(false)

    const [containerInfo, setContainerInfo] = useState<ExposePortInfo[]>([])
    const [containerRunningTrigger, setContainerRunningTrigger] = useState(false);
    const [refreshContainerTrigger, setRefreshContainerTrigger] = useState(false);
    const [containerExpireTime, setContainerExpireTime] = useState<dayjs.Dayjs | null>(dayjs())

    const { theme } = useTheme()

    const handleLaunchContainer = () => {
        setContainerLaunching(true)

        api.user.userCreateContainerForAChallenge(gameID, curChallenge?.challenge_id ?? 0).then((res) => {
            // 开始刷新靶机状态
            setRefreshContainerTrigger(true)
        })
    }

    const handleExtendContainer = () => {

        api.user.userExtendContainerLifeForAChallenge(gameID, curChallenge?.challenge_id ?? 0)
    }

    const handleDestoryContainer = () => {

        api.user.userDeleteContainerForAChallenge(gameID, curChallenge?.challenge_id ?? 0).then((res) => {
            setContainerRunningTrigger(false)

            const newContainers = containerInfo

            for (let i = 0; i < newContainers.length; i++) {
                newContainers[i].container_ports = []
            }

            setContainerInfo(newContainers)
            setContainerExpireTime(null)
        })
    }

    const handleCountdownFinish = () => {
        setContainerRunningTrigger(false)

        const newContainers = containerInfo

        for (let i = 0; i < newContainers.length; i++) {
            newContainers[i].container_ports = []
        }

        setContainerInfo(newContainers)
        setContainerExpireTime(null)
    }

    const memoizedDescription = useMemo(() => {
        return curChallenge?.description ? (
            <div className="flex flex-col gap-0">
                <Mdx source={curChallenge.description} />
            </div>
        ) : (
            <span>题目简介为空哦</span>
        );
    }, [curChallenge?.description]); // 只依赖description

    useEffect(() => {
        if (refreshContainerTrigger == true) {
            const inter = setInterval(() => {
                api.user.userGetContainerInfoForAChallenge(gameID, curChallenge?.challenge_id ?? 0).then((res) => {
                    if (res.data.data.container_status == ContainerStatus.ContainerRunning) {
                        setContainerInfo(res.data.data.containers)
                        setContainerLaunching(false)
                        setContainerRunningTrigger(true)

                        setContainerExpireTime(res.data.data.container_expiretime
                            ? dayjs(res.data.data.container_expiretime)
                            : null)

                        toast.success(t("container_start_success"))

                        clearInterval(inter)
                        setRefreshContainerTrigger(false)
                    } else if (res.data.data.container_status != ContainerStatus.ContainerQueueing &&
                        res.data.data.container_status != ContainerStatus.ContainerStarting
                    ) {
                        setContainerLaunching(false)
                        setContainerRunningTrigger(false)

                        clearInterval(inter)

                        setRefreshContainerTrigger(false)
                    }
                }).catch(() => {
                    toast.error("靶机开启失败")
                    setContainerLaunching(false)
                    setContainerRunningTrigger(false)

                    clearInterval(inter)

                    setRefreshContainerTrigger(false)
                })
            }, randomInt(3000, 5000))

            return () => {
                clearInterval(inter)
            }
        }
    }, [refreshContainerTrigger])

    
    useEffect(() => {
        setContainerInfo(curChallenge?.containers ?? [])
        setContainerExpireTime(curChallenge?.container_expiretime
            ? dayjs(curChallenge.container_expiretime)
            : null)

        if (curChallenge?.container_status == ContainerStatus.ContainerRunning) {
            setContainerRunningTrigger(true)
        } else if (curChallenge?.container_status == ContainerStatus.ContainerQueueing) {
            setContainerLaunching(true)
            setRefreshContainerTrigger(true)
        } else {
            setContainerRunningTrigger(false)
        }
    }, [curChallenge])


    return (
        <>
            <div className="absolute bottom-5 right-7 z-10 flex justify-end flex-col gap-[8px]">
                <div className="flex">
                    <div className="flex-1" />
                    {curChallenge && challengeSolveStatusList ? (challengeSolveStatusList[curChallenge?.challenge_id ?? 0]?.solved ?? false) ? (
                        <Button
                            className="h-[57px] px-5 rounded-3xl backdrop-blur-sm bg-green-600/70 hover:bg-green-800/70 [&_svg]:size-9 gap-2 flex items-center justify-center text-white disabled:opacity-100"
                            onClick={() => { }}
                        >
                            <CheckCheck />
                            <span className="font-bold text-xl">Solved!</span>
                        </Button>
                    ) : (
                        <Button
                            className="h-[57px] px-6 rounded-3xl backdrop-blur-sm bg-red-600/70 hover:bg-red-800/70 [&_svg]:size-8 gap-2 flex items-center justify-center text-white"
                            onClick={() => setSubmitFlagWindowVisible(true)}
                        >
                            <Flag className="rotate-12" />
                            <span className="font-bold text-xl">Submit!</span>
                        </Button>
                    ) : (<></>)
                    }
                </div>
                <div className="flex px-5 py-2 flex-col gap-2 backdrop-blur-sm rounded-2xl select-none border-2 shadow-xl shadow-foreground/5">
                    <div className="flex gap-2 items-center">
                        <AudioWaveform className="size-5" />
                        <span>{gameInfo?.team_info?.team_name}</span>
                    </div>
                    <div className="flex gap-4">
                        <div className="flex gap-2 items-center">
                            <Flag className="size-5" />
                            <span>{scoreBoardModel != undefined ? (scoreBoardModel?.your_team?.score) : (gameInfo?.team_info?.team_score ?? 0)} pts</span>
                        </div>
                        <div className={`flex gap-2 items-center transition-colors duration-300 ${rankColor(scoreBoardModel != undefined ? (scoreBoardModel?.your_team?.rank ?? 0) : (gameInfo?.team_info?.rank ?? 0))}`}>
                            <ChartNoAxesCombined className="size-5" />
                            <span>Rank {scoreBoardModel != undefined ? (scoreBoardModel?.your_team?.rank ?? 0) : (gameInfo?.team_info?.rank ?? 0)}</span>
                        </div>
                    </div>
                </div>
            </div>
            <MacScrollbar
                className="w-full h-full"
                skin={theme === "dark" ? "dark" : "light"}
            >
                <div className="p-5 lg:p-10">
                    {curChallenge?.challenge_name && (
                        <div className="flex flex-col gap-4 mb-4">
                            <ChallengeNameTitle challengeSolveStatusList={challengeSolveStatusList} curChallenge={curChallenge} setShowHintsWindowVisible={setShowHintsWindowVisible} />
                            {memoizedDescription}
                        </div>
                    )}

                    {curChallenge?.containers?.length ? (
                        <div className="flex flex-col gap-4 mb-8">
                            <div className={`flex items-center gap-2 px-5 py-[9px] border-2 rounded-xl bg-foreground/[0.04] backdrop-blur-md select-none`}>
                                <Package />
                                <span className="font-bold text-lg">靶机列表</span>
                                <div className="flex-1" />
                                {!containerRunningTrigger ? (
                                    <div className="flex gap-2 items-center">
                                        <Button className="h-[34px] rounded-[10px] p-0 border-2 px-2 border-foreground bg-background hover:bg-foreground/20 [&_svg]:size-[24px] text-foreground"
                                            onClick={handleLaunchContainer}
                                            disabled={containerLaunching}
                                        >
                                            {containerLaunching ? (
                                                <>
                                                    <Loader2 className="animate-spin" />
                                                    <span className="font-bold text-[1.125em]">Launching</span>
                                                </>
                                            ) : (
                                                <>
                                                    <CirclePower />
                                                    <span className="font-bold text-[1.125em]">Launch</span>
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="flex gap-2 items-center">
                                        <div className="h-[34px] rounded-[10px] border-2 border-green-500 px-2 text-green-500 items-center flex justify-center gap-2">
                                            <AlarmClock />
                                            <TimerDisplay target_time={containerExpireTime} onFinishCallback={handleCountdownFinish} className="font-bold text-md" />
                                        </div>
                                        <Button className="h-[34px] rounded-[10px] p-0 border-2 px-2 border-blue-400 text-blue-400 bg-background dark:hover:bg-blue-200/20 hover:bg-blue-200/60 [&_svg]:size-[24px]"
                                            onClick={handleExtendContainer}
                                        >
                                            <ClockArrowUp />
                                            <span className="font-bold text-[1.125em]">延长靶机</span>
                                        </Button>
                                        <Button className="h-[34px] rounded-[10px] p-0 border-2 px-2 border-red-400 text-red-400 bg-background dark:hover:bg-red-200/20 hover:bg-red-200/60 [&_svg]:size-[24px]"
                                            onClick={handleDestoryContainer}
                                        >
                                            <CircleX />
                                            <span className="font-bold text-[1.125em]">销毁</span>
                                        </Button>
                                    </div>
                                )}
                            </div>

                            <div className={`flex flex-col gap-4 mt-4 select-none`}>
                                {containerInfo.map((container, i) => (
                                    <div key={i} className="flex flex-col gap-[2px]">
                                        <span className="font-bold text-xl mb-2">{container.container_name}</span>
                                        <div className="flex gap-2 items-center">
                                            <Network />
                                            {container.container_ports?.length ? (
                                                <div className="flex gap-2">
                                                    {container.container_ports.map((port, j) => (
                                                        <div key={j} className="flex gap-2 items-center">
                                                            <span className="text-sm font-bold">{port.port_name}:</span>
                                                            <div className="border-2 border-foreground px-2 rounded-md flex items-center justify-center hover:bg-foreground/30 transition-colors duration-300"
                                                                onClick={() => {
                                                                    const status = copy(`${port.ip}:${port.port}`)
                                                                    if (status) {
                                                                        toast.success(t("copied"))
                                                                    } else {
                                                                        toast.success(t("fail_copy"))
                                                                    }
                                                                }}
                                                            >
                                                                <span className="font-bold text-sm">{port.ip}:{port.port}</span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <span className="font-bold">等待启动</span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : <></>}

                    {curChallenge?.attachments?.length ? (
                        <div className="flex flex-col gap-2 mb-4">
                            <div className={`flex items-center gap-2 px-5 py-3 border-2 rounded-xl bg-foreground/[0.04] backdrop-blur-md `}>
                                <Paperclip />
                                <span className="font-bold text-lg">附件列表</span>
                            </div>
                            <div className="flex gap-6 mt-4 flex-col lg:flex-row">
                                {curChallenge?.attachments?.map((attach, attach_index) => (
                                    <FileDownloader key={attach_index} attach={attach} setRedirectURL={setRedirectURL} />
                                ))}
                            </div>
                        </div>
                    ) : (<></>)}
                </div>
            </MacScrollbar>
        </>
    )
}