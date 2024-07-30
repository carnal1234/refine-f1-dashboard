import React from 'react'
import { IPosition } from '../../interfaces'

import { groupBy } from '../../utilities/helper'

export const RacePositionTable = (props: { positionData: Array<IPosition>, driverAcronym: any, isLoading: boolean }) => {

    const positionGroupByDriverNumber = groupBy(props.positionData, i => i.driver_number)


    return (
        <div>



        </div>
    )
}

