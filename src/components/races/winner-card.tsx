// import { totalCountVariants } from "@/constants"
import { Avatar, Card, Skeleton } from "antd"
import { Text } from "../common"
import { Area, AreaConfig } from "@ant-design/plots"
import { UserOutlined } from "@ant-design/icons"

type Props = {
    isLoading: boolean,
}

const RaceWinnerCard = ({

    isLoading

}: Props) => {
    //const { primaryColor, secondaryColor, icon, title } = totalCountVariants[resource];



    return (
        <Card
            style={{ height: "96px", padding: 0 }}
            bodyStyle={{ padding: '8px 8px 8px 12px' }}
            size="small"
        >
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    whiteSpace: 'nowrap'
                }}
            >

                {/* {icon} */}
                <Text size="md" className="secondary" style={{ marginLeft: '8px' }}>
                    Winner
                </Text>
            </div>
            <div
                style={{ display: 'flex', justifyContent: 'space-between', }}
            >
                <Text
                    size="xxxl"
                    strong
                    style={{
                        flex: 1,
                        whiteSpace: 'nowrap',
                        flexShrink: 0,
                        textAlign: 'start',
                        marginLeft: '48px',
                        fontVariantNumeric: 'tabular-nums'
                    }}
                >
                    {isLoading ? (
                        <Skeleton.Button
                            style={{
                                marginTop: '8px',
                                width: '74px'
                            }}
                        />
                    ) : (
                        <>
                            <Text>MAX VERSTAPPEN</Text>
                            <Avatar size="large" icon={<UserOutlined />} src="https://www.formula1.com/content/dam/fom-website/drivers/M/MAXVER01_Max_Verstappen/maxver01.png.transform/1col/image.png" />

                        </>
                    )}
                </Text>

            </div>
        </Card>
    )
}

export default RaceWinnerCard