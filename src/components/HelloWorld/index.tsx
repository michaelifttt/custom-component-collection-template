import React from 'react'
import { type FC } from 'react'
import { useRetoolState } from '@tryretool/custom-component-support'

export const HelloWorld: FC = () => {
    const [name, _setName] = useRetoolState<string>('name', '')

    return (
        <div>
            <div>Hello {name}!</div>
        </div>
    )
}