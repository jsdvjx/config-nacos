import { Module, DynamicModule } from "@nestjs/common";
import { ConfigProvider } from "providers";
import { config } from "config";

@Module({
    providers: [
        {
            provide: 'config',
            useFactory: async () => {
                return config.create()
            }
        }
    ],
    exports: [config]
})
class NestConfigModule {}
export default NestConfigModule