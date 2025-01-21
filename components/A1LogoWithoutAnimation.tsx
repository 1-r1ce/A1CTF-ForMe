"use client";

export function A1LogoWithoutAnimation() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" id="a1logo" viewBox="0 0 4000 4000" preserveAspectRatio="xMidYMid meet">
            <defs>
                <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur in="SourceGraphic" stdDeviation="100" result="blurred" />
                    <feComponentTransfer in="blurred">
                        <feFuncA type="table" tableValues="0.3 1" />
                    </feComponentTransfer>
                    <feMerge>
                        <feMergeNode in="blurred" />
                        <feMergeNode in="SourceGraphic" />
                    </feMerge>
                </filter>
            </defs>

            <path id="a1path" 
            d="M897 2692 c-488 -488 -887 -892 -887 -897 0 -5 126 -136 281 -291
            l281 -281 -51 -101 -51 -102 90 -45 c49 -25 91 -45 93 -45 2 0 18 32 37 70
            l34 71 533 -533 533 -533 890 890 c490 489 890 894 890 900 0 6 -126 136 -279
            289 l-279 279 49 98 c27 54 49 101 49 104 0 4 -174 95 -183 95 -2 0 -18 -32
            -37 -70 l-34 -71 -531 531 c-291 291 -532 530 -535 530 -3 0 -404 -399 -893
            -888z m1378 108 l480 -480 -105 -210 -105 -210 -345 0 -345 0 -236 472 -236
            473 -237 -473 -236 -472 -175 0 -175 0 0 -105 0 -105 120 0 c66 0 120 -2 120
            -5 0 -6 -120 -248 -127 -255 -2 -2 -87 79 -188 180 l-185 185 742 742 c409
            409 745 743 748 743 3 0 221 -216 485 -480z m-772 -665 l117 -235 -240 0 -240
            0 117 235 c65 129 120 235 123 235 3 0 58 -106 123 -235z m1032 -1085 l-745
            -745 -482 482 -483 483 105 210 105 210 345 0 345 0 235 -470 c129 -258 237
            -470 240 -470 3 0 111 211 240 470 l235 470 172 0 173 0 0 105 0 105 -120 0
            -120 0 66 132 66 131 184 -184 184 -184 -745 -745z m-212 405 c-65 -129 -120
            -235 -123 -235 -3 0 -58 106 -123 235 l-117 235 240 0 240 0 -117 -235z" />
        </svg>
    )
}