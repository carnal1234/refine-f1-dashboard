import React, { useState } from 'react'

import { DriverParams } from '@/interfaces/openf1'
import DriverAvatar from './driver-avatar'
import { Avatar, AvatarProps, Row, Col } from 'antd'
import styled from 'styled-components'

import { chunk } from '@/utilities/helper'

import { driverImage, isValidColor } from '@/utilities/helper'

interface DriverAvatarGroupProps {
    drivers: Array<DriverParams>,
    selectedDrivers: Record<string, boolean>,
    toggleDriverSelect: (driver: DriverParams) => void
}

interface CustomAvatarProps {
    isselected: string,
    bordercolor: string
}
const StyledAvatar: React.FunctionComponent<AvatarProps & CustomAvatarProps> = styled(Avatar) <{ isselected: string; bordercolor: string, }> `
width: 100px;
height: 100px;
border-radius: 50%;
margin-bottom: 10px;
border: 2px solid ${(props) => props.bordercolor};
${(props) => props.isselected == "false" && `filter: brightness(50%);`}
${(props) => props.isselected == "true" && `background-image: linear-gradient(to top, var(--tw-gradient-stops));`}
${(props) => props.isselected == "true" && `--tw-gradient-from: #fff var(--tw-gradient-from-position);`}
${(props) => props.isselected == "true" && `--tw-gradient-to: transparent var(--tw-gradient-to-position);`}
${(props) => props.isselected == "true" && `--tw-gradient-stops: var(--tw-gradient-from), ${props.bordercolor} var(--tw-gradient-via-position), var(--tw-gradient-to);`}
transition: background-color ease 0.75s, filter ease 0.5s;

&:hover {
    background-color: ${(props) => props.isselected == "true" ? ('#000000') : (props.bordercolor)};
    filter: brightness(100%);
}
`;

const DriverAvatarGroup: React.FC<DriverAvatarGroupProps> = ({ drivers, selectedDrivers, toggleDriverSelect }) => {

    const perChunk = 10

    const splited_drivers = chunk(drivers, perChunk)


    return (
        <div>

            {splited_drivers && splited_drivers.map((drivers: Array<DriverParams>) => {

                return (
                    <Row justify="center">

                        {
                            drivers.map((driver: DriverParams) => {

                                const driver_no = driver.driver_number?.toString()!

                                const borderColor = isValidColor(`#${driver.team_colour}`)
                                    ? `#${driver.team_colour}`
                                    : "#fff";
                                const isselected = (selectedDrivers &&
                                    selectedDrivers.hasOwnProperty(driver_no)) ? (selectedDrivers[driver_no] ? "true" : "false") : "false"


                                return (
                                    <Col span={2}>
                                        <StyledAvatar
                                            size={64}
                                            src={driverImage(driver?.first_name!, driver?.last_name!)}
                                            alt={`${driver.first_name} ${driver.last_name}`}
                                            bordercolor={borderColor}
                                            isselected={isselected}
                                            key={driver?.driver_number}

                                            onClick={() => toggleDriverSelect(driver)}
                                        // initial={{ opacity: 0, y: 50 }}
                                        // animate={{ opacity: 1, y: 0 }}
                                        // transition={{ duration: 1 }}

                                        >
                                        </StyledAvatar>
                                    </Col>
                                )
                            })
                        }

                    </Row>
                )
            })

            }










        </div >
    )
}

export default DriverAvatarGroup
