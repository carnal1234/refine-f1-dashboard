import React, { useState } from 'react'

import { DriverParams } from '@/interfaces/openf1'
import DriverAvatar from './driver-avatar'
import { Avatar, AvatarProps, Row, Col, Button } from 'antd'
import styled from 'styled-components'

import { chunk } from '@/utilities/helper'

import { driverImage, isValidColor } from '@/utilities/helper'

interface DriverAvatarGroupProps {
    drivers: Array<DriverParams>,
    selectedDrivers: Record<string, boolean>,
    toggleDriverSelect: (driver: DriverParams) => void,
    showAllSelected: boolean,
    onToggleAllDrivers: () => void
}

interface CustomAvatarProps {
    isselected: boolean,
    bordercolor: string
}
const StyledAvatar: React.FunctionComponent<AvatarProps & CustomAvatarProps> = styled(Avatar) <{ isselected: boolean; bordercolor: string, }> `
width: 100px;
height: 100px;
border-radius: 50%;
margin-bottom: 10px;
border: 2px solid ${(props) => props.bordercolor};
${(props) => !props.isselected && `filter: brightness(50%);`}
${(props) => props.isselected && `background-image: linear-gradient(to top, var(--tw-gradient-stops));`}
${(props) => props.isselected && `--tw-gradient-from: #fff var(--tw-gradient-from-position);`}
${(props) => props.isselected && `--tw-gradient-to: transparent var(--tw-gradient-to-position);`}
${(props) => props.isselected && `--tw-gradient-stops: var(--tw-gradient-from), ${props.bordercolor} var(--tw-gradient-via-position), var(--tw-gradient-to);`}
transition: background-color ease 0.75s, filter ease 0.5s;

&:hover {
    background-color: ${(props) => props.isselected ? ('#000000') : (props.bordercolor)};
    filter: brightness(100%);
}
`;

const DriverAvatarGroup: React.FC<DriverAvatarGroupProps> = ({ drivers, selectedDrivers, toggleDriverSelect, showAllSelected, onToggleAllDrivers }) => {

    const perChunk = 10

    const splited_drivers = chunk(drivers, perChunk)


    return (
        <div>
            {/* <Button onClick={onToggleAllDrivers} style={{ marginBottom: '20px' }} type='primary' >
                {"Toggle Selected Drivers"}
            </Button> */}

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
                                    selectedDrivers.hasOwnProperty(driver_no)) ? (selectedDrivers[driver_no] ? true : false) : false

                                return (
                                    <Col span={2}>
                                        <div onClick={() => toggleDriverSelect(driver)}>
                                            <StyledAvatar
                                                size={64}
                                                src={driverImage(driver?.first_name!, driver?.last_name!)}
                                                alt={`${driver.first_name} ${driver.last_name}`}
                                                bordercolor={borderColor}
                                                isselected={isselected}
                                                key={driver?.driver_number}
                                            >
                                            </StyledAvatar>
                                        </div>
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
