import { Provider } from "@nestjs/common";
import config from "index";

export const ConfigProvider = (path: string) => ({
    provide: 'config',
    useFactory: async () => {
        return config.create(path)
    }
}) as Provider