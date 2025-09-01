import { Avatar, AvatarProps } from 'antd'
import styled from 'styled-components'
import { motion } from 'framer-motion'
import { driverImage, isValidColor } from '@/utilities/helper'
import { DriverParams } from '@/interfaces/openf1'

interface CustomAvatarProps {
    isselected: string,
    bordercolor: string,
    size?: number
}

const DriverAvatar = (props: { driverData: DriverParams; size?: number }) => {
    const StyledAvatar: React.FunctionComponent<AvatarProps & CustomAvatarProps> = styled(Avatar) <{ isselected: string; bordercolor: string; size?: number }> `
        width: ${(props) => props.size || 100}px;
        height: ${(props) => props.size || 100}px;
        border-radius: 50%;
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

    const borderColor = isValidColor(`#${props.driverData.team_colour}`)
        ? `#${props.driverData.team_colour}`
        : "#fff";

    const driver = props.driverData

    return (
        <>
            <StyledAvatar
                size={props.size || 64}
                src={driverImage(driver?.first_name!, driver?.last_name!)}
                alt={`${driver.first_name} ${driver.last_name}`}
                bordercolor={borderColor}
                isselected='true'
            >
            </StyledAvatar>
        </>
    )
}

export default DriverAvatar
